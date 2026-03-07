from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count
from .models import DiagnosticFile
from .serializers import DiagnosticFileSerializer
from rest_framework.parsers import MultiPartParser, FormParser

from .models import Diagnostic, TopographieICD, MorphologieICD, StyleVie
from .serializers import (
    DiagnosticListSerializer, DiagnosticDetailSerializer,
    DiagnosticCreateSerializer, TopographieSerializer, MorphologieSerializer,
    StyleVieSerializer,
)
from apps.accounts.models import AccessLog
from apps.accounts.permissions import CanReadOrWriteDiagnostic, can_write_diagnostic

# Doit correspondre exactement à TRAITEMENT_RELATED dans serializers.py
TRAITEMENT_PREFETCHES = [
    'chimiotherapie_set',
    'radiotherapie_set',
    'chirurgie_set',
    'hormonotherapie_set',
    'immunotherapie_set',
]


class TopographieViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class   = TopographieSerializer
    permission_classes = [IsAuthenticated]
    filter_backends    = [filters.SearchFilter]
    search_fields      = ['code', 'libelle', 'categorie']
    queryset           = TopographieICD.objects.filter(est_actif=True)
    pagination_class   = None


class MorphologieViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class   = MorphologieSerializer
    permission_classes = [IsAuthenticated]
    filter_backends    = [filters.SearchFilter, DjangoFilterBackend]
    search_fields      = ['code', 'libelle', 'groupe']
    filterset_fields   = ['comportement', 'groupe']
    queryset           = MorphologieICD.objects.filter(est_actif=True)
    pagination_class   = None


class DiagnosticViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, CanReadOrWriteDiagnostic]
    filter_backends    = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields   = ['patient', 'stade_ajcc', 'lateralite', 'est_principal',
                          'tnm_type', 'type_diagnostic', 'etat_cancer', 'statut_dossier']
    search_fields      = ['topographie_code', 'topographie_libelle',
                          'morphologie_code', 'morphologie_libelle',
                          'patient__nom', 'patient__registration_number',
                          'numero_dossier', 'medecin_referent']
    ordering_fields    = ['date_diagnostic', 'date_creation', 'stade_ajcc']
    ordering           = ['-date_diagnostic']

    def get_queryset(self):
        qs = Diagnostic.objects.select_related(
            'patient', 'topographie', 'morphologie', 'cree_par', 'style_vie'
        ).prefetch_related(*TRAITEMENT_PREFETCHES)
        # ^^ prefetch_related en une seule passe — évite N+1 queries sur la liste

        patient_id = self.request.query_params.get('patient_id')
        if patient_id:
            qs = qs.filter(patient_id=patient_id)
        return qs

    def get_serializer_class(self):
        if self.action == 'list':
            return DiagnosticListSerializer
        if self.action in ['create', 'update', 'partial_update']:
            return DiagnosticCreateSerializer
        return DiagnosticDetailSerializer

    def perform_create(self, serializer):
        if not can_write_diagnostic(self.request.user):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Saisie de diagnostics réservée aux oncologues et anatomopathologistes.")
        diag = serializer.save(cree_par=self.request.user)
        AccessLog.objects.create(
            user=self.request.user, action=AccessLog.Action.CREATE,
            resource='diagnostic', resource_id=str(diag.id),
            ip_address=self.request.META.get('REMOTE_ADDR'),
        )

    def perform_update(self, serializer):
        if not can_write_diagnostic(self.request.user):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Modification réservée aux oncologues et anatomopathologistes.")
        serializer.save(modifie_par=self.request.user)

    @action(detail=True, methods=['get', 'put', 'patch'], url_path='style-vie')
    def style_vie(self, request, pk=None):
        diag = self.get_object()
        if request.method == 'GET':
            try:
                sv = diag.style_vie
                return Response(StyleVieSerializer(sv).data)
            except StyleVie.DoesNotExist:
                return Response({})
        if not can_write_diagnostic(request.user):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied()
        sv, _ = StyleVie.objects.get_or_create(diagnostic=diag)
        partial = request.method == 'PATCH'
        ser = StyleVieSerializer(sv, data=request.data, partial=partial)
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(ser.data)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        qs = Diagnostic.objects.all()
        return Response({
            'total': qs.count(),
            'par_stade': list(qs.values('stade_ajcc').annotate(count=Count('id')).order_by('stade_ajcc')),
            'par_topographie': list(qs.values('topographie_code', 'topographie_libelle').annotate(count=Count('id')).order_by('-count')[:10]),
            'par_type_diagnostic': list(qs.values('type_diagnostic').annotate(count=Count('id'))),
            'par_etat': list(qs.values('etat_cancer').annotate(count=Count('id'))),
            'par_morphologie_groupe': list(
                qs.exclude(morphologie__isnull=True)
                  .values('morphologie__groupe').annotate(count=Count('id')).order_by('-count')[:8]
            ),
            'par_base': list(qs.values('base_diagnostic').annotate(count=Count('id'))),
        })

    @action(detail=False, methods=['get'])
    def par_patient(self, request):
        patient_id = request.query_params.get('patient_id')
        if not patient_id:
            return Response({'error': 'patient_id requis'}, status=400)
        qs = self.get_queryset().filter(patient_id=patient_id)
        return Response(DiagnosticListSerializer(qs, many=True).data)
    
    @action(detail=True, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def upload_file(self, request, pk=None):
        diagnostic = self.get_object()

        fichier = request.FILES.get('fichier')
        if not fichier:
            return Response({'error': 'Fichier requis'}, status=400)

        obj = DiagnosticFile.objects.create(
            diagnostic=diagnostic,
            fichier=fichier,
            uploaded_by=request.user
        )

        serializer = DiagnosticFileSerializer(obj, context={'request': request})
        return Response(serializer.data, status=201)


    @action(detail=True, methods=['delete'], url_path='delete-file/(?P<file_id>[^/.]+)')
    def delete_file(self, request, pk=None, file_id=None):
        diagnostic = self.get_object()

        try:
            file_obj = diagnostic.files.get(id=file_id)
        except DiagnosticFile.DoesNotExist:
            return Response({'error': 'Fichier introuvable'}, status=404)

        file_obj.delete()
        return Response(status=204)


    @action(detail=True, methods=['get'])
    def files(self, request, pk=None):
        diagnostic = self.get_object()
        files = diagnostic.files.all()
        serializer = DiagnosticFileSerializer(files, many=True, context={'request': request})
        return Response(serializer.data)