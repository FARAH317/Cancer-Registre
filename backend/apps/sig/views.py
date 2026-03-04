"""
SIG – Carte Oncologique d'Algérie
Vues API – entièrement branchées sur les modèles réels.
"""
from django.db.models import Count, Q, Sum
from django.utils import timezone
from rest_framework import viewsets, filters, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from .models import (
    Wilaya, Commune, FacteurRisque,
    StatCancerWilaya, StatCancerCommune, AlerteEpidemiologique,
)
from .serializers import (
    WilayaListSerializer, WilayaDetailSerializer,
    CommuneSerializer, FacteurRisqueSerializer,
    StatCancerWilayaSerializer, AlerteSerializer,
)


# ─────────────────────────────────────────────────────────────────
# 1. VUE PRINCIPALE – overview carte (toutes les wilayas)
# ─────────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def sig_overview(request):
    """
    Retourne les statistiques de toutes les wilayas pour alimenter la carte.
    Utilise le cache StatCancerWilaya si disponible (mis à jour via cron),
    sinon calcule en temps réel depuis Patient + Diagnostic.
    """
    annee     = int(request.query_params.get('annee', timezone.now().year))
    use_cache = request.query_params.get('use_cache', 'true').lower() == 'true'

    wilayas = Wilaya.objects.all().prefetch_related(
        'facteurs_risque', 'communes', 'stats_cancer',
    )

    result         = []
    total_national = 0

    for wilaya in wilayas:
        stat_cache = None
        if use_cache:
            stat_cache = wilaya.stats_cancer.filter(annee=annee, est_complet=True).first()

        if stat_cache:
            total         = stat_cache.total_patients
            cancers       = stat_cache.cancers_json
            communes_data = stat_cache.communes_json
            incidence     = float(stat_cache.incidence_pour_100k) if stat_cache.incidence_pour_100k else None
        else:
            total, cancers, communes_data, incidence = _compute_wilaya_stats(wilaya)

        total_national += total

        risk_factors = list(
            FacteurRisque.objects
            .filter(actif=True)
            .filter(
                Q(wilaya=wilaya) |
                Q(region=wilaya.region, portee='region') |
                Q(portee='national')
            )
            .order_by('ordre')
            .values('nom', 'niveau', 'icone', 'source')
        )
        for rf in risk_factors:
            rf['niveau_fr'] = _niveau_fr(rf['niveau'])

        alertes = list(wilaya.alertes.filter(active=True).values('niveau', 'titre', 'type_cancer'))

        result.append({
            "code":                wilaya.code,
            "nom":                 wilaya.nom,
            "region":              wilaya.region,
            "region_label":        wilaya.get_region_display(),
            "latitude":            float(wilaya.latitude)  if wilaya.latitude  else None,
            "longitude":           float(wilaya.longitude) if wilaya.longitude else None,
            "population":          wilaya.population,
            "superficie_km2":      wilaya.superficie_km2,
            "chef_lieu":           wilaya.chef_lieu,
            "total_patients":      total,
            "cancers":             cancers,
            "communes":            communes_data,
            "risk_factors":        risk_factors,
            "alertes":             alertes,
            "incidence_pour_100k": incidence,
        })

    return Response({
        "wilayas":        result,
        "total_national": total_national,
        "annee":          annee,
        "timestamp":      timezone.now().isoformat(),
    })


# ─────────────────────────────────────────────────────────────────
# 2. DÉTAIL D'UNE WILAYA
# ─────────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def sig_wilaya_detail(request, wilaya_code):
    """
    Détail complet : évolution multi-années, communes, facteurs de risque, alertes.
    """
    try:
        wilaya = Wilaya.objects.prefetch_related(
            'communes', 'facteurs_risque', 'stats_cancer', 'alertes'
        ).get(code=wilaya_code)
    except Wilaya.DoesNotExist:
        return Response({"error": "Wilaya introuvable"}, status=status.HTTP_404_NOT_FOUND)

    # Évolution depuis le cache ou calcul ponctuel
    evolution     = []
    stats_cache   = wilaya.stats_cancer.filter(est_complet=True).order_by('annee')
    if stats_cache.exists():
        for s in stats_cache:
            evolution.append({
                "annee":     s.annee,
                "total":     s.total_patients,
                "hommes":    s.total_hommes,
                "femmes":    s.total_femmes,
                "nouveaux":  s.total_nouveaux,
                "incidence": float(s.incidence_pour_100k) if s.incidence_pour_100k else None,
                "cancers":   s.cancers_json,
            })
    else:
        total, cancers, _, incidence = _compute_wilaya_stats(wilaya)
        evolution.append({"annee": timezone.now().year, "total": total, "cancers": cancers, "incidence": incidence})

    # Communes détaillées
    communes_detail = []
    for commune in wilaya.communes.all():
        stat_c = commune.stats_cancer.filter(annee=timezone.now().year).first()
        if stat_c:
            communes_detail.append({
                "nom": commune.nom, "code": commune.code,
                "total": stat_c.total_patients, "cancers": stat_c.cancers_json,
                "latitude":  float(commune.latitude)  if commune.latitude  else None,
                "longitude": float(commune.longitude) if commune.longitude else None,
            })
        else:
            from apps.patients.models import Patient
            total_c = Patient.objects.filter(wilaya_code=wilaya_code, commune__iexact=commune.nom).count()
            if total_c > 0:
                communes_detail.append({
                    "nom": commune.nom, "code": commune.code, "total": total_c,
                    "cancers": _compute_commune_cancers(wilaya_code, commune.nom),
                    "latitude":  float(commune.latitude)  if commune.latitude  else None,
                    "longitude": float(commune.longitude) if commune.longitude else None,
                })
    communes_detail.sort(key=lambda x: x['total'], reverse=True)

    # Facteurs de risque
    risk_factors = list(
        FacteurRisque.objects
        .filter(actif=True)
        .filter(Q(wilaya=wilaya) | Q(region=wilaya.region, portee='region') | Q(portee='national'))
        .order_by('ordre')
        .values('nom', 'niveau', 'icone', 'description', 'source')
    )
    for rf in risk_factors:
        rf['niveau_fr'] = _niveau_fr(rf['niveau'])

    alertes = AlerteSerializer(wilaya.alertes.filter(active=True), many=True).data
    latest  = evolution[-1] if evolution else {}

    return Response({
        "code":                wilaya.code,
        "nom":                 wilaya.nom,
        "nom_ar":              wilaya.nom_ar,
        "region":              wilaya.region,
        "region_label":        wilaya.get_region_display(),
        "chef_lieu":           wilaya.chef_lieu,
        "superficie_km2":      wilaya.superficie_km2,
        "population":          wilaya.population,
        "latitude":            float(wilaya.latitude)  if wilaya.latitude  else None,
        "longitude":           float(wilaya.longitude) if wilaya.longitude else None,
        "total_patients":      latest.get('total', 0),
        "cancers":             latest.get('cancers', {}),
        "incidence_pour_100k": latest.get('incidence'),
        "communes":            communes_detail,
        "risk_factors":        risk_factors,
        "evolution":           evolution,
        "alertes":             alertes,
    })


# ─────────────────────────────────────────────────────────────────
# 3. STATS NATIONALES
# ─────────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def sig_stats_nationales(request):
    """Vue agrégée nationale : top cancers, régions, évolution."""
    from apps.patients.models import Patient
    from apps.diagnostics.models import Diagnostic

    cancers_national = {}
    for row in Diagnostic.objects.values('type_cancer').annotate(n=Count('id')).order_by('-n'):
        if row['type_cancer']:
            cancers_national[row['type_cancer']] = row['n']

    par_region = {}
    for wilaya in Wilaya.objects.all():
        count = Patient.objects.filter(wilaya_code=wilaya.code).count()
        par_region[wilaya.region] = par_region.get(wilaya.region, 0) + count

    evolution_cache = (
        StatCancerWilaya.objects.filter(est_complet=True)
        .values('annee')
        .annotate(total=Sum('total_patients'), nouveaux=Sum('total_nouveaux'))
        .order_by('annee')
    )

    return Response({
        "total_national":     Patient.objects.count(),
        "cancers_national":   cancers_national,
        "par_region":         par_region,
        "evolution":          list(evolution_cache),
        "annee":              timezone.now().year,
        "nb_wilayas_actives": Wilaya.objects.filter(
            stats_cancer__total_patients__gt=0
        ).distinct().count(),
    })


# ─────────────────────────────────────────────────────────────────
# 4. VIEWSETS CRUD
# ─────────────────────────────────────────────────────────────────

class WilayaViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset           = Wilaya.objects.prefetch_related('communes', 'facteurs_risque').all()
    filter_backends    = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields   = ['region']
    search_fields      = ['nom', 'chef_lieu']

    def get_serializer_class(self):
        return WilayaDetailSerializer if self.action == 'retrieve' else WilayaListSerializer

    @action(detail=True, methods=['post'])
    def recalculer_stats(self, request, pk=None):
        wilaya = self.get_object()
        annee  = int(request.data.get('annee', timezone.now().year))
        stat   = StatCancerWilaya.calculer_et_sauvegarder(wilaya.code, annee)
        if stat:
            return Response({"success": True, "total_patients": stat.total_patients})
        return Response({"error": "Calcul impossible"}, status=400)


class FacteurRisqueViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class   = FacteurRisqueSerializer
    filter_backends    = [DjangoFilterBackend]
    filterset_fields   = ['portee', 'region', 'wilaya', 'niveau', 'actif']

    def get_queryset(self):
        return FacteurRisque.objects.select_related('wilaya').filter(actif=True)


class AlerteViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class   = AlerteSerializer
    filter_backends    = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields   = ['wilaya', 'niveau', 'active', 'type_cancer']
    ordering           = ['-date_debut']

    def get_queryset(self):
        return AlerteEpidemiologique.objects.select_related('wilaya', 'cree_par')

    def perform_create(self, serializer):
        serializer.save(cree_par=self.request.user)


# ─────────────────────────────────────────────────────────────────
# HELPERS PRIVÉS
# ─────────────────────────────────────────────────────────────────

def _compute_wilaya_stats(wilaya):
    from apps.patients.models import Patient
    from apps.diagnostics.models import Diagnostic

    patients_qs = Patient.objects.filter(wilaya_code=wilaya.code)
    total       = patients_qs.count()

    cancers = {}
    for row in Diagnostic.objects.filter(patient__wilaya_code=wilaya.code).values('type_cancer').annotate(n=Count('id')).order_by('-n'):
        if row['type_cancer']:
            cancers[row['type_cancer']] = row['n']

    communes_qs = patients_qs.values('commune').annotate(total=Count('id')).order_by('-total')[:20]
    communes_data = [
        {"nom": r['commune'] or 'Inconnue', "total": r['total'],
         "cancers": _compute_commune_cancers(wilaya.code, r['commune'])}
        for r in communes_qs if r['commune']
    ]

    incidence = None
    if wilaya.population and wilaya.population > 0 and total > 0:
        incidence = round((total / wilaya.population) * 100_000, 2)

    return total, cancers, communes_data, incidence


def _compute_commune_cancers(wilaya_code, commune_nom):
    from apps.diagnostics.models import Diagnostic
    if not commune_nom:
        return {}
    qs = (
        Diagnostic.objects
        .filter(patient__wilaya_code=wilaya_code, patient__commune__iexact=commune_nom)
        .values('type_cancer').annotate(n=Count('id'))
    )
    return {row['type_cancer']: row['n'] for row in qs if row['type_cancer']}


def _niveau_fr(niveau):
    return {'tres_eleve': 'très élevé', 'eleve': 'élevé', 'modere': 'modéré', 'faible': 'faible'}.get(niveau, niveau)