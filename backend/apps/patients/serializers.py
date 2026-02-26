from rest_framework import serializers
from .models import Patient, ContactUrgence
from apps.accounts.serializers import UserSummarySerializer


class ContactUrgenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactUrgence
        fields = ['id', 'nom', 'prenom', 'lien', 'telephone', 'telephone2']
        read_only_fields = ['id']


class PatientListSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    medecin_nom = serializers.CharField(source='medecin_referent.get_display_name', read_only=True)
    sexe_label = serializers.SerializerMethodField()
    statut_label = serializers.SerializerMethodField()
    age = serializers.SerializerMethodField()
    
    class Meta:
        model = Patient
        fields = [
            'id', 'registration_number', 'id_national',
            'nom', 'prenom', 'full_name', 'sexe', 'sexe_label', 'age',
            'statut_dossier', 'statut_label', 'statut_vital',
            'wilaya', 'telephone',
            'date_enregistrement', 'medecin_referent', 'medecin_nom',
        ]

    def get_full_name(self, obj):
        return f"{obj.nom} {obj.prenom}".strip()

    def get_age(self, obj):
        return obj.age

    def get_sexe_label(self, obj):
        return dict(Patient.Sexe.choices).get(obj.sexe, obj.sexe)

    def get_statut_label(self, obj):
        return dict(Patient.StatutDossier.choices).get(obj.statut_dossier, obj.statut_dossier)


class PatientDetailSerializer(serializers.ModelSerializer):
    medecin_referent_info = UserSummarySerializer(source='medecin_referent', read_only=True)
    cree_par_info = UserSummarySerializer(source='cree_par', read_only=True)
    contacts_urgence = ContactUrgenceSerializer(many=True, read_only=True)
    full_name = serializers.SerializerMethodField()
    age = serializers.SerializerMethodField()
    sexe_label = serializers.SerializerMethodField()
    statut_label = serializers.SerializerMethodField()
    statut_vital_label = serializers.SerializerMethodField()
    
    class Meta:
        model = Patient
        fields = [
            # Identifiants
            'id', 'registration_number', 'id_national',
            # Identité
            'nom', 'prenom', 'full_name', 'nom_jeune_fille', 'sexe', 'sexe_label',
            'date_naissance', 'age', 'age_diagnostic', 'lieu_naissance', 'nationalite',
            # Coordonnées
            'adresse', 'commune', 'wilaya', 'code_postal',
            'telephone', 'telephone2', 'email',
            # Profil socio-démographique
            'niveau_instruction', 'profession', 'situation_familiale', 'nombre_enfants',
            # Antécédents
            'antecedents_personnels', 'antecedents_familiaux',
            'tabagisme', 'alcool',
            # Statut
            'statut_dossier', 'statut_label', 'statut_vital', 'statut_vital_label',
            'date_deces', 'cause_deces',
            # Médecin référent
            'medecin_referent', 'medecin_referent_info', 'etablissement_pec',
            # Métadonnées
            'contacts_urgence',
            'date_enregistrement', 'date_modification',
            'cree_par', 'cree_par_info',
            'notes', 'est_actif',
        ]
        read_only_fields = [
            'id', 'registration_number', 'date_enregistrement',
            'date_modification', 'cree_par',
        ]

    def get_full_name(self, obj):
        return f"{obj.nom} {obj.prenom}".strip()

    def get_age(self, obj):
        return obj.age

    def get_sexe_label(self, obj):
        return dict(Patient.Sexe.choices).get(obj.sexe, obj.sexe)

    def get_statut_label(self, obj):
        return dict(Patient.StatutDossier.choices).get(obj.statut_dossier, obj.statut_dossier)

    def get_statut_vital_label(self, obj):
        return dict(Patient.StatutVital.choices).get(obj.statut_vital, obj.statut_vital)


class PatientCreateSerializer(serializers.ModelSerializer):
    contacts_urgence = ContactUrgenceSerializer(many=True, required=False)
    
    class Meta:
        model = Patient
        fields = [
            # Identifiants
            'id_national',
            # Identité
            'nom', 'prenom', 'nom_jeune_fille', 'sexe',
            'date_naissance', 'age_diagnostic', 'lieu_naissance', 'nationalite',
            # Coordonnées
            'adresse', 'commune', 'wilaya', 'code_postal',
            'telephone', 'telephone2', 'email',
            # Profil socio-démographique
            'niveau_instruction', 'profession', 'situation_familiale', 'nombre_enfants',
            # Antécédents
            'antecedents_personnels', 'antecedents_familiaux',
            'tabagisme', 'alcool',
            # Statut
            'statut_dossier', 'statut_vital',
            'date_deces', 'cause_deces',
            # Médecin référent
            'medecin_referent', 'etablissement_pec',
            # Contacts urgence
            'contacts_urgence',
            # Notes
            'notes',
        ]

    def create(self, validated_data):
        contacts_data = validated_data.pop('contacts_urgence', [])
        patient = Patient.objects.create(**validated_data)
        
        for contact_data in contacts_data:
            ContactUrgence.objects.create(patient=patient, **contact_data)
        
        return patient

    def update(self, instance, validated_data):
        contacts_data = validated_data.pop('contacts_urgence', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        if contacts_data is not None:
            instance.contacts_urgence.all().delete()
            for contact_data in contacts_data:
                ContactUrgence.objects.create(patient=instance, **contact_data)
        
        return instance
