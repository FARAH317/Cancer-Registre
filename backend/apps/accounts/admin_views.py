from rest_framework import viewsets, filters, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.db.models import Count, Q
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from datetime import timedelta

from apps.accounts.models import AccessLog
from apps.patients.models import Patient
from apps.diagnostics.models import Diagnostic

User = get_user_model()


# ── Permission helper ──────────────────────────────────────────────
def is_admin(user):
    return user.is_superuser or user.role == 'admin' or user.can_manage_users


# ─────────────────────────────────────────────────────────────────
# USER SERIALIZERS (inline)
# ─────────────────────────────────────────────────────────────────
from rest_framework import serializers

class UserAdminListSerializer(serializers.ModelSerializer):
    role_label       = serializers.CharField(source='get_role_display', read_only=True)
    speciality_label = serializers.CharField(source='get_speciality_display', read_only=True)
    full_name        = serializers.SerializerMethodField()
    last_login_str   = serializers.SerializerMethodField()
    nb_actions       = serializers.SerializerMethodField()

    class Meta:
        model  = User
        fields = [
            'id', 'username', 'email', 'full_name', 'first_name', 'last_name',
            'role', 'role_label', 'speciality', 'speciality_label',
            'institution', 'wilaya', 'phone',
            'is_active', 'is_staff', 'is_superuser',
            'can_view_patients', 'can_edit_patients', 'can_export_data',
            'can_manage_users', 'can_view_statistics',
            'date_joined', 'last_login', 'last_login_str', 'nb_actions',
        ]

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username

    def get_last_login_str(self, obj):
        if not obj.last_login:
            return 'Jamais connecté'
        diff = timezone.now() - obj.last_login
        if diff.days == 0:
            return "Aujourd'hui"
        if diff.days == 1:
            return "Hier"
        if diff.days < 7:
            return f"Il y a {diff.days} jours"
        return obj.last_login.strftime('%d/%m/%Y')

    def get_nb_actions(self, obj):
        return AccessLog.objects.filter(user=obj).count()


class UserAdminUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = User
        fields = [
            'first_name', 'last_name', 'phone',
            'role', 'speciality', 'institution', 'wilaya',
            'is_active', 'is_staff',
            'can_view_patients', 'can_edit_patients', 'can_export_data',
            'can_manage_users', 'can_view_statistics',
        ]

    def update(self, instance, validated_data):
        # Auto-set permissions based on role
        role = validated_data.get('role', instance.role)
        ROLE_PERMS = {
            'admin':          dict(can_view_patients=True,  can_edit_patients=True,  can_export_data=True,  can_manage_users=True,  can_view_statistics=True),
            'doctor':         dict(can_view_patients=True,  can_edit_patients=True,  can_export_data=False, can_manage_users=False, can_view_statistics=True),
            'registrar':      dict(can_view_patients=True,  can_edit_patients=True,  can_export_data=False, can_manage_users=False, can_view_statistics=False),
            'epidemiologist': dict(can_view_patients=True,  can_edit_patients=False, can_export_data=True,  can_manage_users=False, can_view_statistics=True),
            'analyst':        dict(can_view_patients=False, can_edit_patients=False, can_export_data=True,  can_manage_users=False, can_view_statistics=True),
            'readonly':       dict(can_view_patients=True,  can_edit_patients=False, can_export_data=False, can_manage_users=False, can_view_statistics=True),
        }
        if role in ROLE_PERMS and 'role' in validated_data:
            for perm, val in ROLE_PERMS[role].items():
                if perm not in validated_data:
                    validated_data[perm] = val
        return super().update(instance, validated_data)


class AccessLogSerializer(serializers.ModelSerializer):
    user_nom    = serializers.SerializerMethodField()
    user_role   = serializers.SerializerMethodField()
    action_label= serializers.CharField(source='get_action_display', read_only=True)

    class Meta:
        model  = AccessLog
        fields = [
            'id', 'user', 'user_nom', 'user_role',
            'action', 'action_label', 'resource', 'resource_id',
            'ip_address', 'timestamp', 'details',
        ]

    def get_user_nom(self, obj):
        if obj.user:
            return obj.user.get_full_name() or obj.user.username
        return 'Système'

    def get_user_role(self, obj):
        if obj.user:
            return obj.user.get_role_display()
        return '—'


# ─────────────────────────────────────────────────────────────────
# USERS VIEWSET
# ─────────────────────────────────────────────────────────────────

class UserAdminViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    filter_backends    = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields   = ['role', 'is_active', 'speciality', 'wilaya']
    search_fields      = ['username', 'email', 'first_name', 'last_name', 'institution']
    ordering           = ['-date_joined']

    def get_queryset(self):
        return User.objects.all()

    def get_serializer_class(self):
        if self.action in ['update', 'partial_update']:
            return UserAdminUpdateSerializer
        return UserAdminListSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        # Mutations require admin
        return [IsAuthenticated()]

    def update(self, request, *args, **kwargs):
        if not is_admin(request.user):
            return Response({'error': 'Permission refusée'}, status=403)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if not is_admin(request.user):
            return Response({'error': 'Permission refusée'}, status=403)
        user = self.get_object()
        if user == request.user:
            return Response({'error': 'Vous ne pouvez pas supprimer votre propre compte'}, status=400)
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['post'])
    def activer(self, request, pk=None):
        if not is_admin(request.user):
            return Response({'error': 'Permission refusée'}, status=403)
        user = self.get_object()
        user.is_active = True
        user.save()
        AccessLog.objects.create(
            user=request.user, action='update',
            resource='user', resource_id=str(user.id),
            ip_address=request.META.get('REMOTE_ADDR'),
            details={'action': 'activation', 'target_user': user.username}
        )
        return Response({'status': 'actif', 'message': f'{user.get_full_name()} activé'})

    @action(detail=True, methods=['post'])
    def desactiver(self, request, pk=None):
        if not is_admin(request.user):
            return Response({'error': 'Permission refusée'}, status=403)
        user = self.get_object()
        if user == request.user:
            return Response({'error': 'Impossible de vous désactiver vous-même'}, status=400)
        user.is_active = False
        user.save()
        AccessLog.objects.create(
            user=request.user, action='update',
            resource='user', resource_id=str(user.id),
            ip_address=request.META.get('REMOTE_ADDR'),
            details={'action': 'desactivation', 'target_user': user.username}
        )
        return Response({'status': 'inactif', 'message': f'{user.get_full_name()} désactivé'})

    @action(detail=True, methods=['post'])
    def reset_password(self, request, pk=None):
        if not is_admin(request.user):
            return Response({'error': 'Permission refusée'}, status=403)
        user   = self.get_object()
        newpwd = request.data.get('password')
        if not newpwd or len(newpwd) < 8:
            return Response({'error': 'Mot de passe trop court (min 8 car.)'}, status=400)
        user.set_password(newpwd)
        user.save()
        AccessLog.objects.create(
            user=request.user, action='update',
            resource='user', resource_id=str(user.id),
            ip_address=request.META.get('REMOTE_ADDR'),
            details={'action': 'reset_password', 'target_user': user.username}
        )
        return Response({'message': 'Mot de passe réinitialisé'})

    @action(detail=True, methods=['post'])
    def set_role(self, request, pk=None):
        if not is_admin(request.user):
            return Response({'error': 'Permission refusée'}, status=403)
        user    = self.get_object()
        new_role = request.data.get('role')
        valid_roles = [r[0] for r in User.Role.choices]
        if new_role not in valid_roles:
            return Response({'error': 'Rôle invalide'}, status=400)
        old_role    = user.role
        user.role   = new_role
        # Auto permissions
        ROLE_PERMS = {
            'admin':          dict(can_view_patients=True,  can_edit_patients=True,  can_export_data=True,  can_manage_users=True,  can_view_statistics=True),
            'doctor':         dict(can_view_patients=True,  can_edit_patients=True,  can_export_data=False, can_manage_users=False, can_view_statistics=True),
            'registrar':      dict(can_view_patients=True,  can_edit_patients=True,  can_export_data=False, can_manage_users=False, can_view_statistics=False),
            'epidemiologist': dict(can_view_patients=True,  can_edit_patients=False, can_export_data=True,  can_manage_users=False, can_view_statistics=True),
            'analyst':        dict(can_view_patients=False, can_edit_patients=False, can_export_data=True,  can_manage_users=False, can_view_statistics=True),
            'readonly':       dict(can_view_patients=True,  can_edit_patients=False, can_export_data=False, can_manage_users=False, can_view_statistics=True),
        }
        if new_role in ROLE_PERMS:
            for perm, val in ROLE_PERMS[new_role].items():
                setattr(user, perm, val)
        user.save()
        AccessLog.objects.create(
            user=request.user, action='update',
            resource='user', resource_id=str(user.id),
            ip_address=request.META.get('REMOTE_ADDR'),
            details={'action': 'role_change', 'old': old_role, 'new': new_role, 'target': user.username}
        )
        return Response({'role': user.role, 'role_display': user.get_role_display()})

    @action(detail=False, methods=['get'])
    def stats(self, request):
        total = User.objects.count()
        today = timezone.now().date()
        return Response({
            'total':          total,
            'actifs':         User.objects.filter(is_active=True).count(),
            'inactifs':       User.objects.filter(is_active=False).count(),
            'par_role':       list(User.objects.values('role').annotate(n=Count('id')).order_by('-n')),
            'nouveaux_mois':  User.objects.filter(date_joined__month=today.month, date_joined__year=today.year).count(),
            'connectes_7j':   User.objects.filter(last_login__gte=timezone.now()-timedelta(days=7)).count(),
        })


# ─────────────────────────────────────────────────────────────────
# AUDIT LOGS VIEWSET
# ─────────────────────────────────────────────────────────────────

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class   = AccessLogSerializer
    filter_backends    = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields   = ['action', 'resource', 'user']
    search_fields      = ['user__username', 'user__email', 'resource', 'resource_id', 'ip_address']
    ordering           = ['-timestamp']

    def get_queryset(self):
        qs = AccessLog.objects.select_related('user')
        # Date range filter
        date_from = self.request.query_params.get('date_from')
        date_to   = self.request.query_params.get('date_to')
        user_id   = self.request.query_params.get('user_id')
        if date_from:
            qs = qs.filter(timestamp__date__gte=date_from)
        if date_to:
            qs = qs.filter(timestamp__date__lte=date_to)
        if user_id:
            qs = qs.filter(user_id=user_id)
        return qs

    @action(detail=False, methods=['get'])
    def stats(self, request):
        now    = timezone.now()
        today  = now.date()
        hier   = today - timedelta(days=1)
        s7j    = now  - timedelta(days=7)
        s30j   = now  - timedelta(days=30)
        return Response({
            'total':          AccessLog.objects.count(),
            'aujourd_hui':    AccessLog.objects.filter(timestamp__date=today).count(),
            'hier':           AccessLog.objects.filter(timestamp__date=hier).count(),
            'cette_semaine':  AccessLog.objects.filter(timestamp__gte=s7j).count(),
            'ce_mois':        AccessLog.objects.filter(timestamp__gte=s30j).count(),
            'par_action':     list(AccessLog.objects.values('action').annotate(n=Count('id')).order_by('-n')),
            'par_ressource':  list(AccessLog.objects.exclude(resource='').values('resource').annotate(n=Count('id')).order_by('-n')[:10]),
            'top_users':      list(
                AccessLog.objects.values('user__username', 'user__first_name', 'user__last_name')
                .annotate(n=Count('id')).order_by('-n')[:10]
            ),
            'activite_7j':    [
                {
                    'date': str(today - timedelta(days=i)),
                    'count': AccessLog.objects.filter(timestamp__date=today - timedelta(days=i)).count()
                }
                for i in range(6, -1, -1)
            ],
        })


# ─────────────────────────────────────────────────────────────────
# SYSTEM INFO
# ─────────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def system_info(request):
    """Informations système et base de données."""
    from apps.treatments.models import Chimiotherapie, Radiotherapie, Chirurgie, Hormonotherapie, Immunotherapie
    from apps.rcp.models import ReunionRCP, DossierRCP
    from apps.suivi.models import ConsultationSuivi, EffetIndesirable
    import django, sys

    return Response({
        'database': {
            'patients':       Patient.objects.count(),
            'patients_actifs':Patient.objects.filter(est_actif=True).count(),
            'diagnostics':    Diagnostic.objects.count(),
            'traitements': {
                'chimio':   Chimiotherapie.objects.count(),
                'radio':    Radiotherapie.objects.count(),
                'chirurgie':Chirurgie.objects.count(),
                'hormono':  Hormonotherapie.objects.count(),
                'immuno':   Immunotherapie.objects.count(),
            },
            'consultations':  ConsultationSuivi.objects.count(),
            'effets_indesirables': EffetIndesirable.objects.filter(resolu=False).count(),
            'reunions_rcp':   ReunionRCP.objects.count(),
            'dossiers_rcp':   DossierRCP.objects.count(),
            'users':          User.objects.count(),
            'audit_logs':     AccessLog.objects.count(),
        },
        'system': {
            'django_version': django.__version__,
            'python_version': sys.version.split()[0],
            'server_time':    timezone.now().isoformat(),
        },
    })