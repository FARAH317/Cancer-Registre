from django.http import HttpResponse, JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Count, Q
from django.utils import timezone

from apps.patients.models import Patient
from apps.diagnostics.models import Diagnostic
from apps.treatments.models import Chimiotherapie, Radiotherapie, Chirurgie, Hormonotherapie, Immunotherapie

from .excel_generator import (
    export_patients_xlsx, export_diagnostics_xlsx,
    export_rapport_epidemio_xlsx, export_canreg5_csv,
)
from .pdf_generator import (
    generate_fiche_patient_pdf, generate_rapport_epidemio_pdf,
)


def _get_stats_data():
    """Compile les statistiques pour les rapports."""
    from apps.registry.views import dashboard_global
    from django.test import RequestFactory
    # On reconstruit les stats directement
    total_patients    = Patient.objects.filter(est_actif=True).count()
    total_diagnostics = Diagnostic.objects.count()
    total_traitements = (
        Chimiotherapie.objects.count() + Radiotherapie.objects.count() +
        Chirurgie.objects.count() + Hormonotherapie.objects.count() +
        Immunotherapie.objects.count()
    )
    return {
        'kpis': {
            'total_patients':    total_patients,
            'total_diagnostics': total_diagnostics,
            'total_traitements': total_traitements,
            'en_traitement':     Patient.objects.filter(statut_dossier='traitement').count(),
            'en_remission':      Patient.objects.filter(statut_dossier='remission').count(),
            'decedes':           Patient.objects.filter(statut_vital='decede').count(),
        },
        'par_sexe': {
            'M': Patient.objects.filter(est_actif=True, sexe='M').count(),
            'F': Patient.objects.filter(est_actif=True, sexe='F').count(),
        },
        'top_cancers': list(
            Diagnostic.objects.exclude(topographie_libelle='')
            .values('topographie_code', 'topographie_libelle')
            .annotate(count=Count('id')).order_by('-count')[:15]
        ),
        'par_stade': list(
            Diagnostic.objects.values('stade_ajcc').annotate(count=Count('id')).order_by('stade_ajcc')
        ),
        'top_wilayas': list(
            Patient.objects.filter(est_actif=True).exclude(wilaya='')
            .values('wilaya').annotate(count=Count('id')).order_by('-count')[:15]
        ),
        'traitements_types': [
            {'type':'Chimiothérapie',  'count': Chimiotherapie.objects.count()},
            {'type':'Radiothérapie',   'count': Radiotherapie.objects.count()},
            {'type':'Chirurgie',       'count': Chirurgie.objects.count()},
            {'type':'Hormonothérapie', 'count': Hormonotherapie.objects.count()},
            {'type':'Immunothérapie',  'count': Immunotherapie.objects.count()},
        ],
    }


# ─────────────────────────────────────────────────────────────────
# EXPORTS EXCEL
# ─────────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_patients_excel(request):
    """Export liste des patients en XLSX."""
    # Filtres optionnels
    qs = Patient.objects.filter(est_actif=True).select_related('medecin_referent')
    wilaya = request.query_params.get('wilaya')
    sexe   = request.query_params.get('sexe')
    statut = request.query_params.get('statut')
    annee  = request.query_params.get('annee')
    if wilaya: qs = qs.filter(wilaya=wilaya)
    if sexe:   qs = qs.filter(sexe=sexe)
    if statut: qs = qs.filter(statut_dossier=statut)
    if annee:  qs = qs.filter(date_enregistrement__year=annee)

    buf  = export_patients_xlsx(qs)
    today = timezone.now().strftime('%Y%m%d')
    filename = f"patients_{today}.xlsx"

    resp = HttpResponse(
        buf.read(),
        content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    resp['Content-Disposition'] = f'attachment; filename="{filename}"'
    return resp


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_diagnostics_excel(request):
    """Export liste des diagnostics en XLSX."""
    qs = Diagnostic.objects.select_related('patient').all()
    annee  = request.query_params.get('annee')
    wilaya = request.query_params.get('wilaya')
    if annee:  qs = qs.filter(date_diagnostic__year=annee)
    if wilaya: qs = qs.filter(patient__wilaya=wilaya)

    buf   = export_diagnostics_xlsx(qs)
    today = timezone.now().strftime('%Y%m%d')
    filename = f"diagnostics_{today}.xlsx"

    resp = HttpResponse(
        buf.read(),
        content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    resp['Content-Disposition'] = f'attachment; filename="{filename}"'
    return resp


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_rapport_excel(request):
    """Rapport épidémiologique complet en XLSX multi-feuilles."""
    annee     = request.query_params.get('annee')
    stats     = _get_stats_data()
    buf       = export_rapport_epidemio_xlsx(stats, annee=annee)
    today     = timezone.now().strftime('%Y%m%d')
    filename  = f"rapport_epidemio_{annee or 'complet'}_{today}.xlsx"

    resp = HttpResponse(
        buf.read(),
        content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    resp['Content-Disposition'] = f'attachment; filename="{filename}"'
    return resp


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_canreg5(request):
    """Export format CanReg5 (IARC) en CSV tabulé."""
    annee  = request.query_params.get('annee')
    wilaya = request.query_params.get('wilaya')

    pat_qs  = Patient.objects.filter(est_actif=True)
    diag_qs = Diagnostic.objects.select_related('patient')
    if annee:  diag_qs = diag_qs.filter(date_diagnostic__year=annee)
    if wilaya: pat_qs  = pat_qs.filter(wilaya=wilaya)

    data     = export_canreg5_csv(pat_qs, diag_qs)
    today    = timezone.now().strftime('%Y%m%d')
    filename = f"canreg5_{annee or 'complet'}_{today}.txt"

    resp = HttpResponse(data, content_type='text/plain; charset=utf-8')
    resp['Content-Disposition'] = f'attachment; filename="{filename}"'
    return resp


# ─────────────────────────────────────────────────────────────────
# EXPORTS PDF
# ─────────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_fiche_patient_pdf(request, patient_id):
    """Fiche patient complète en PDF."""
    try:
        patient = Patient.objects.select_related('medecin_referent').get(pk=patient_id)
    except Patient.DoesNotExist:
        return Response({'error': 'Patient introuvable'}, status=404)

    diagnostics = list(Diagnostic.objects.filter(patient=patient))

    # Compiler traitements
    traitements = []
    for chimio in Chimiotherapie.objects.filter(patient=patient):
        traitements.append({'type':'chimiotherapie','detail':chimio.protocole or '','date_debut':str(chimio.date_debut or ''),'statut':chimio.statut,'intention':chimio.intention})
    for radio in Radiotherapie.objects.filter(patient=patient):
        traitements.append({'type':'radiotherapie','detail':radio.site_irradie or '','date_debut':str(radio.date_debut or ''),'statut':radio.statut,'intention':radio.intention})
    for chir in Chirurgie.objects.filter(patient=patient):
        traitements.append({'type':'chirurgie','detail':chir.intitule_acte or '','date_debut':str(chir.date_debut or ''),'statut':chir.statut,'intention':chir.intention})
    for h in Hormonotherapie.objects.filter(patient=patient):
        traitements.append({'type':'hormonotherapie','detail':h.molecule or '','date_debut':str(h.date_debut or ''),'statut':h.statut,'intention':h.intention})
    for imm in Immunotherapie.objects.filter(patient=patient):
        traitements.append({'type':'immunotherapie','detail':imm.molecule or '','date_debut':str(imm.date_debut or ''),'statut':imm.statut,'intention':imm.intention})

    buf      = generate_fiche_patient_pdf(patient, diagnostics, traitements or None)
    filename = f"fiche_{patient.registration_number}.pdf"

    resp = HttpResponse(buf.read(), content_type='application/pdf')
    resp['Content-Disposition'] = f'attachment; filename="{filename}"'
    return resp


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_rapport_pdf(request):
    """Rapport épidémiologique en PDF."""
    annee    = request.query_params.get('annee')
    stats    = _get_stats_data()
    buf      = generate_rapport_epidemio_pdf(stats, annee=annee)
    today    = timezone.now().strftime('%Y%m%d')
    filename = f"rapport_epidemio_{annee or 'complet'}_{today}.pdf"

    resp = HttpResponse(buf.read(), content_type='application/pdf')
    resp['Content-Disposition'] = f'attachment; filename="{filename}"'
    return resp


# ─────────────────────────────────────────────────────────────────
# MÉTADONNÉES (liste des exports disponibles)
# ─────────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def exports_info(request):
    """Retourne les compteurs pour afficher dans l'UI."""
    return Response({
        'patients':    Patient.objects.filter(est_actif=True).count(),
        'diagnostics': Diagnostic.objects.count(),
        'traitements': (
            Chimiotherapie.objects.count() + Radiotherapie.objects.count() +
            Chirurgie.objects.count() + Hormonotherapie.objects.count() +
            Immunotherapie.objects.count()
        ),
        'last_update': timezone.now().isoformat(),
    })
