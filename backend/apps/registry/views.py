from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta, date

from apps.patients.models import Patient
from apps.diagnostics.models import Diagnostic
from apps.treatments.models import (
    Chimiotherapie, Radiotherapie,
    Chirurgie, Hormonotherapie, Immunotherapie
)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_global(request):
    today      = timezone.now().date()
    an_courant = today.year
    debut_annee = date(an_courant, 1, 1)
    debut_mois  = date(an_courant, today.month, 1)
    il_y_a_30j  = today - timedelta(days=30)

    # ── KPIs ────────────────────────────────────────────────────
    total_patients     = Patient.objects.filter(est_actif=True).count()
    nouveaux_ce_mois   = Patient.objects.filter(date_enregistrement__date__gte=debut_mois).count()
    nouveaux_annee     = Patient.objects.filter(date_enregistrement__date__gte=debut_annee).count()
    patients_en_trt    = Patient.objects.filter(statut_dossier='traitement').count()
    patients_remission = Patient.objects.filter(statut_dossier='remission').count()
    patients_decedes   = Patient.objects.filter(statut_vital='decede').count()
    patients_perdus    = Patient.objects.filter(statut_dossier='perdu').count()
    total_diagnostics  = Diagnostic.objects.count()
    diagnostics_annee  = Diagnostic.objects.filter(date_diagnostic__gte=debut_annee).count()
    total_traitements  = (
        Chimiotherapie.objects.count() + Radiotherapie.objects.count() +
        Chirurgie.objects.count() + Hormonotherapie.objects.count() +
        Immunotherapie.objects.count()
    )

    # ── Répartition sexe ────────────────────────────────────────
    par_sexe = {
        'M': Patient.objects.filter(est_actif=True, sexe='M').count(),
        'F': Patient.objects.filter(est_actif=True, sexe='F').count(),
    }

    # ── Statuts dossiers ─────────────────────────────────────────
    par_statut = list(
        Patient.objects.filter(est_actif=True)
        .values('statut_dossier')
        .annotate(count=Count('id'))
        .order_by('statut_dossier')
    )

    # ── Top 10 cancers ───────────────────────────────────────────
    top_cancers = list(
        Diagnostic.objects.exclude(topographie_libelle='')
        .values('topographie_code', 'topographie_libelle')
        .annotate(count=Count('id'))
        .order_by('-count')[:10]
    )

    # ── Distribution stades AJCC ─────────────────────────────────
    par_stade = list(
        Diagnostic.objects.values('stade_ajcc')
        .annotate(count=Count('id'))
        .order_by('stade_ajcc')
    )

    # ── Évolution 12 derniers mois ───────────────────────────────
    evolution_mensuelle = []
    for i in range(11, -1, -1):
        # Calcul mois correct
        mois_offset = today.month - i - 1
        annee_offset = today.year + mois_offset // 12
        mois_num = mois_offset % 12 + 1
        mois_date = date(annee_offset, mois_num, 1)

        if mois_date.month == 12:
            fin_mois = date(mois_date.year + 1, 1, 1)
        else:
            fin_mois = date(mois_date.year, mois_date.month + 1, 1)

        MOIS_FR = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']

        evolution_mensuelle.append({
            'mois':        f"{MOIS_FR[mois_date.month-1]} {mois_date.year}",
            'mois_court':  MOIS_FR[mois_date.month-1],
            'patients':    Patient.objects.filter(
                date_enregistrement__date__gte=mois_date,
                date_enregistrement__date__lt=fin_mois
            ).count(),
            'diagnostics': Diagnostic.objects.filter(
                date_diagnostic__gte=mois_date,
                date_diagnostic__lt=fin_mois
            ).count(),
        })

    # ── Top wilayas ──────────────────────────────────────────────
    top_wilayas = list(
        Patient.objects.filter(est_actif=True).exclude(wilaya='')
        .values('wilaya')
        .annotate(count=Count('id'))
        .order_by('-count')[:15]
    )

    # ── Tranches d'âge ───────────────────────────────────────────
    tranches_age = []
    for debut, fin, label in [(0,18,'0-17'),(18,30,'18-29'),(30,45,'30-44'),
                               (45,60,'45-59'),(60,75,'60-74'),(75,200,'75+')]:
        tranches_age.append({
            'tranche': label,
            'count': Patient.objects.filter(
                est_actif=True, age_diagnostic__gte=debut, age_diagnostic__lt=fin
            ).count()
        })

    # ── Traitements ──────────────────────────────────────────────
    traitements_types = [
        {'type': 'Chimiothérapie',  'count': Chimiotherapie.objects.count(),  'color': '#00a8ff'},
        {'type': 'Radiothérapie',   'count': Radiotherapie.objects.count(),   'color': '#f5a623'},
        {'type': 'Chirurgie',       'count': Chirurgie.objects.count(),       'color': '#ff4d6a'},
        {'type': 'Hormonothérapie', 'count': Hormonotherapie.objects.count(), 'color': '#00e5a0'},
        {'type': 'Immunothérapie',  'count': Immunotherapie.objects.count(),  'color': '#c084fc'},
    ]

    # ── Réponses chimio ──────────────────────────────────────────
    reponses_chimio = list(
        Chimiotherapie.objects.exclude(reponse_tumorale='')
        .values('reponse_tumorale')
        .annotate(count=Count('id'))
        .order_by('-count')
    )

    # ── Activité récente ─────────────────────────────────────────
    activite_recente = {
        'nouveaux_patients':    Patient.objects.filter(date_enregistrement__date__gte=il_y_a_30j).count(),
        'nouveaux_diagnostics': Diagnostic.objects.filter(date_creation__date__gte=il_y_a_30j).count(),
        'nouveaux_chimio':      Chimiotherapie.objects.filter(date_creation__date__gte=il_y_a_30j).count(),
        'nouvelles_chirurgies': Chirurgie.objects.filter(date_creation__date__gte=il_y_a_30j).count(),
    }

    # ── Base du diagnostic ───────────────────────────────────────
    base_diagnostic = list(
        Diagnostic.objects.values('base_diagnostic')
        .annotate(count=Count('id'))
        .order_by('-count')
    )

    return Response({
        'kpis': {
            'total_patients':    total_patients,
            'nouveaux_ce_mois':  nouveaux_ce_mois,
            'nouveaux_annee':    nouveaux_annee,
            'en_traitement':     patients_en_trt,
            'en_remission':      patients_remission,
            'decedes':           patients_decedes,
            'perdus_vue':        patients_perdus,
            'total_diagnostics': total_diagnostics,
            'diagnostics_annee': diagnostics_annee,
            'total_traitements': total_traitements,
            'annee_courante':    an_courant,
        },
        'par_sexe':            par_sexe,
        'par_statut':          par_statut,
        'top_cancers':         top_cancers,
        'par_stade':           par_stade,
        'evolution_mensuelle': evolution_mensuelle,
        'top_wilayas':         top_wilayas,
        'tranches_age':        tranches_age,
        'traitements_types':   traitements_types,
        'reponses_chimio':     reponses_chimio,
        'activite_recente':    activite_recente,
        'base_diagnostic':     base_diagnostic,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def alertes(request):
    return Response({
        'patients_perdus_vue':  Patient.objects.filter(statut_dossier='perdu').count(),
        'nouveaux_dossiers':    Patient.objects.filter(statut_dossier='nouveau').count(),
        'sans_diagnostic':      Patient.objects.filter(
            diagnostics__isnull=True, est_actif=True
        ).count(),
    })
