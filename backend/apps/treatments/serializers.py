from rest_framework import serializers
from .models import (
    Chimiotherapie, MedicamentChimio,
    Radiotherapie, Chirurgie,
    Hormonotherapie, Immunotherapie,
)


class MedicamentChimioSerializer(serializers.ModelSerializer):
    class Meta:
        model  = MedicamentChimio
        fields = ['id', 'dci', 'dose', 'unite_dose', 'jour_administration']


class ChimiotherapieListSerializer(serializers.ModelSerializer):
    patient_nom     = serializers.CharField(source='patient.get_full_name', read_only=True)
    patient_numero  = serializers.CharField(source='patient.registration_number', read_only=True)
    statut_label    = serializers.CharField(source='get_statut_display', read_only=True)
    intention_label = serializers.CharField(source='get_intention_display', read_only=True)
    reponse_label   = serializers.CharField(source='get_reponse_tumorale_display', read_only=True)

    class Meta:
        model  = Chimiotherapie
        fields = [
            'id', 'patient', 'patient_nom', 'patient_numero',
            'protocole', 'ligne', 'statut', 'statut_label',
            'intention', 'intention_label',
            'date_debut', 'date_fin',
            'nombre_cycles', 'cycles_realises',
            'reponse_tumorale', 'reponse_label',
            'toxicite_grade', 'date_creation',
        ]


class ChimiotherapieDetailSerializer(serializers.ModelSerializer):
    medicaments     = MedicamentChimioSerializer(many=True, read_only=True)
    statut_label    = serializers.CharField(source='get_statut_display', read_only=True)
    intention_label = serializers.CharField(source='get_intention_display', read_only=True)
    voie_label      = serializers.CharField(source='get_voie_administration_display', read_only=True)
    reponse_label   = serializers.CharField(source='get_reponse_tumorale_display', read_only=True)
    patient_nom     = serializers.CharField(source='patient.get_full_name', read_only=True)
    patient_numero  = serializers.CharField(source='patient.registration_number', read_only=True)

    class Meta:
        model  = Chimiotherapie
        fields = '__all__'
        read_only_fields = ['date_creation', 'date_modification', 'cree_par']


class ChimiotherapieCreateSerializer(serializers.ModelSerializer):
    medicaments = MedicamentChimioSerializer(many=True, required=False)

    class Meta:
        model   = Chimiotherapie
        exclude = ['cree_par', 'date_creation', 'date_modification']

    def create(self, validated_data):
        meds_data = validated_data.pop('medicaments', [])
        if self.context.get('request'):
            validated_data['cree_par'] = self.context['request'].user
        chimio = Chimiotherapie.objects.create(**validated_data)
        for m in meds_data:
            MedicamentChimio.objects.create(chimiotherapie=chimio, **m)
        return chimio

    def update(self, instance, validated_data):
        meds_data = validated_data.pop('medicaments', None)
        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        instance.save()
        if meds_data is not None:
            instance.medicaments.all().delete()
            for m in meds_data:
                MedicamentChimio.objects.create(chimiotherapie=instance, **m)
        return instance


class RadiotherapieSerializer(serializers.ModelSerializer):
    statut_label    = serializers.CharField(source='get_statut_display', read_only=True)
    technique_label = serializers.CharField(source='get_technique_display', read_only=True)
    intention_label = serializers.CharField(source='get_intention_display', read_only=True)
    patient_nom     = serializers.CharField(source='patient.get_full_name', read_only=True)
    patient_numero  = serializers.CharField(source='patient.registration_number', read_only=True)

    class Meta:
        model  = Radiotherapie
        fields = '__all__'
        read_only_fields = ['date_creation', 'date_modification', 'cree_par']

    def create(self, validated_data):
        if self.context.get('request'):
            validated_data['cree_par'] = self.context['request'].user
        return super().create(validated_data)


class ChirurgieSerializer(serializers.ModelSerializer):
    statut_label    = serializers.CharField(source='get_statut_display', read_only=True)
    type_label      = serializers.CharField(source='get_type_chirurgie_display', read_only=True)
    voie_label      = serializers.CharField(source='get_voie_abord_display', read_only=True)
    marges_label    = serializers.CharField(source='get_marges_resection_display', read_only=True)
    intention_label = serializers.CharField(source='get_intention_display', read_only=True)
    patient_nom     = serializers.CharField(source='patient.get_full_name', read_only=True)
    patient_numero  = serializers.CharField(source='patient.registration_number', read_only=True)

    class Meta:
        model  = Chirurgie
        fields = '__all__'
        read_only_fields = ['date_creation', 'date_modification', 'cree_par']

    def create(self, validated_data):
        if self.context.get('request'):
            validated_data['cree_par'] = self.context['request'].user
        return super().create(validated_data)


class HormonotherapieSerializer(serializers.ModelSerializer):
    statut_label    = serializers.CharField(source='get_statut_display', read_only=True)
    type_label      = serializers.CharField(source='get_type_hormonotherapie_display', read_only=True)
    intention_label = serializers.CharField(source='get_intention_display', read_only=True)
    patient_nom     = serializers.CharField(source='patient.get_full_name', read_only=True)
    patient_numero  = serializers.CharField(source='patient.registration_number', read_only=True)

    class Meta:
        model  = Hormonotherapie
        fields = '__all__'
        read_only_fields = ['date_creation', 'date_modification', 'cree_par']

    def create(self, validated_data):
        if self.context.get('request'):
            validated_data['cree_par'] = self.context['request'].user
        return super().create(validated_data)


class ImmunotherapieSerializer(serializers.ModelSerializer):
    statut_label    = serializers.CharField(source='get_statut_display', read_only=True)
    type_label      = serializers.CharField(source='get_type_immunotherapie_display', read_only=True)
    intention_label = serializers.CharField(source='get_intention_display', read_only=True)
    patient_nom     = serializers.CharField(source='patient.get_full_name', read_only=True)
    patient_numero  = serializers.CharField(source='patient.registration_number', read_only=True)

    class Meta:
        model  = Immunotherapie
        fields = '__all__'
        read_only_fields = ['date_creation', 'date_modification', 'cree_par']

    def create(self, validated_data):
        if self.context.get('request'):
            validated_data['cree_par'] = self.context['request'].user
        return super().create(validated_data)
