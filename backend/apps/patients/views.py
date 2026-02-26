from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count
from django.utils import timezone

from .models import Patient, ContactUrgence
from .serializers import (
    PatientListSerializer,
    PatientDetailSerializer,
    PatientCreateSerializer,
    ContactUrgenceSerializer,
)
from apps.accounts.models import AccessLog


class ReadOnlyOrAuthenticated(IsAuthenticated):
    """
    Allow read access without authentication.
    Require authentication for write operations.
    """
    def has_permission(self, request, view):
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return True
        return super().has_permission(request, view)


class PatientViewSet(viewsets.ModelViewSet):
    permission_classes = [ReadOnlyOrAuthenticated]
    filter_backends    = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields   = ['sexe', 'statut_dossier', 'statut_vital', 'wilaya']
    search_fields      = ['nom', 'prenom', 'registration_number', 'id_national', 'telephone']
    ordering_fields    = ['nom', 'date_enregistrement', 'date_naissance']
    ordering           = ['-date_enregistrement']

    def get_queryset(self):
        qs = Patient.objects.filter(est_actif=True).select_related(
            'medecin_referent', 'cree_par'
        ).prefetch_related('contacts_urgence')

        # Filtres supplémentaires
        age_min = self.request.query_params.get('age_min')
        age_max = self.request.query_params.get('age_max')
        if age_min:
            qs = qs.filter(age_diagnostic__gte=age_min)
        if age_max:
            qs = qs.filter(age_diagnostic__lte=age_max)

        return qs

    def get_serializer_class(self):
        if self.action == 'list':
            return PatientListSerializer
        if self.action in ['create', 'update', 'partial_update']:
            return PatientCreateSerializer
        return PatientDetailSerializer

    def perform_create(self, serializer):
        # Only log if user is authenticated
        if self.request.user.is_authenticated:
            patient = serializer.save(cree_par=self.request.user)
            AccessLog.objects.create(
                user=self.request.user,
                action=AccessLog.Action.CREATE,
                resource='patient',
                resource_id=str(patient.id),
                ip_address=self.request.META.get('REMOTE_ADDR'),
            )
        else:
            serializer.save()

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        # Only log if user is authenticated
        if request.user.is_authenticated:
            AccessLog.objects.create(
                user=request.user,
                action=AccessLog.Action.VIEW,
                resource='patient',
                resource_id=str(instance.id),
                ip_address=request.META.get('REMOTE_ADDR'),
            )
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Statistiques rapides pour le dashboard."""
        qs = Patient.objects.filter(est_actif=True)
        return Response({
            'total':        qs.count(),
            'nouveau':      qs.filter(statut_dossier='nouveau').count(),
            'traitement':   qs.filter(statut_dossier='traitement').count(),
            'remission':    qs.filter(statut_dossier='remission').count(),
            'decede':       qs.filter(statut_vital='decede').count(),
            'perdu_vue':    qs.filter(statut_dossier='perdu').count(),
            'par_sexe': {
                'M': qs.filter(sexe='M').count(),
                'F': qs.filter(sexe='F').count(),
            },
            'par_wilaya': list(
                qs.values('wilaya').annotate(count=Count('id'))
                  .order_by('-count')[:10]
            ),
        })

    @action(detail=True, methods=['post'])
    def changer_statut(self, request, pk=None):
        patient = self.get_object()
        nouveau_statut = request.data.get('statut_dossier')
        if nouveau_statut not in dict(Patient.StatutDossier.choices):
            return Response({'error': 'Statut invalide.'}, status=400)
        patient.statut_dossier = nouveau_statut
        patient.save()
        return Response({'message': 'Statut mis à jour.', 'statut': nouveau_statut})

    @action(detail=False, methods=['get'])
    def search_advanced(self, request):
        """Recherche avancée multi-critères."""
        qs = self.get_queryset()
        q = request.query_params.get('q', '').strip()
        if q:
            qs = qs.filter(
                Q(nom__icontains=q) | Q(prenom__icontains=q) |
                Q(registration_number__icontains=q) |
                Q(id_national__icontains=q) |
                Q(telephone__icontains=q)
            )
        serializer = PatientListSerializer(qs[:50], many=True)
        return Response({'results': serializer.data, 'count': qs.count()})
