from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

User = get_user_model()


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Extended JWT token with user info."""
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['email']      = user.email
        token['full_name']  = user.get_display_name()
        token['role']       = user.role
        token['username']   = user.username
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user
        data['user'] = {
            'id':           user.id,
            'email':        user.email,
            'username':     user.username,
            'full_name':    user.get_display_name(),
            'role':         user.role,
            'role_display': user.get_role_display(),
            'institution':  user.institution,
            'wilaya':       user.wilaya,
            'speciality':   user.speciality,
            'avatar':       user.avatar.url if user.avatar else None,
            'permissions': {
                'can_view_patients':   user.can_view_patients,
                'can_edit_patients':   user.can_edit_patients,
                'can_export_data':     user.can_export_data,
                'can_manage_users':    user.can_manage_users,
                'can_view_statistics': user.can_view_statistics,
            }
        }
        return data


class UserSummarySerializer(serializers.ModelSerializer):
    """Minimal user info for nested representations."""
    display_name = serializers.CharField(source='get_display_name', read_only=True)
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'display_name', 'role', 'role_display', 'institution']


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for new user registration."""
    password         = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True, label="Confirmation mot de passe")

    class Meta:
        model  = User
        fields = [
            'email', 'username', 'password', 'password_confirm',
            'first_name', 'last_name', 'phone',
            'role', 'speciality', 'registration_number',
            'institution', 'wilaya', 'department',
        ]
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name':  {'required': True},
        }

    def validate(self, attrs):
        if attrs['password'] != attrs.pop('password_confirm'):
            raise serializers.ValidationError({"password": "Les mots de passe ne correspondent pas."})
        return attrs

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        # New users are inactive until admin approves
        user.is_active = False
        user.save()
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    full_name    = serializers.CharField(source='get_full_name', read_only=True)
    display_name = serializers.CharField(source='get_display_name', read_only=True)
    role_display = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model  = User
        fields = [
            'id', 'email', 'username', 'full_name', 'display_name',
            'first_name', 'last_name', 'phone', 'avatar',
            'role', 'role_display', 'speciality', 'registration_number',
            'institution', 'wilaya', 'department',
            'can_view_patients', 'can_edit_patients',
            'can_export_data', 'can_manage_users', 'can_view_statistics',
            'is_active', 'is_verified', 'date_joined', 'last_login',
        ]
        read_only_fields = [
            'id', 'email', 'role', 'is_active', 'is_verified',
            'date_joined', 'last_login',
            'can_view_patients', 'can_edit_patients',
            'can_export_data', 'can_manage_users',
        ]


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    confirm_password = serializers.CharField(required=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"new_password": "Les mots de passe ne correspondent pas."})
        return attrs
