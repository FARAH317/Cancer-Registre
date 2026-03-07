from rest_framework import serializers
from .models import (
    Chimiotherapie, MedicamentChimio,
    Radiotherapie, Chirurgie,
    Hormonotherapie, Immunotherapie,
)



# ── Serializer diagnostic complet (lecture seule, imbriqué) ──────
class DiagnosticResumSerializer(serializers.Serializer):
    """
    Résumé complet du diagnostic lié — expose toutes les infos
    utiles au frontend (TNM, stade, marqueurs, morphologie...).
    Évite la dépendance circulaire avec l'app diagnostics.
    """
    # Identification
    id                       = serializers.IntegerField(read_only=True)
    numero_dossier           = serializers.CharField(read_only=True)
    date_diagnostic          = serializers.DateField(read_only=True)
    type_diagnostic          = serializers.CharField(read_only=True)

    # Topographie / Morphologie
    topographie_code         = serializers.CharField(read_only=True)
    topographie_libelle      = serializers.CharField(read_only=True)
    morphologie_code         = serializers.CharField(read_only=True)
    morphologie_libelle      = serializers.CharField(read_only=True)
    lateralite               = serializers.CharField(read_only=True)
    grade_histologique       = serializers.CharField(read_only=True)
    variante_histologique    = serializers.CharField(read_only=True)
    categorie_cancer         = serializers.CharField(read_only=True)

    # TNM
    tnm_t                    = serializers.CharField(read_only=True)
    tnm_n                    = serializers.CharField(read_only=True)
    tnm_m                    = serializers.CharField(read_only=True)
    tnm_type                 = serializers.CharField(read_only=True)
    tnm_edition              = serializers.CharField(read_only=True)
    tnm_descripteurs         = serializers.CharField(read_only=True)
    tnm_certitude            = serializers.CharField(read_only=True)
    tnm_date_evaluation      = serializers.DateField(read_only=True)
    tnm_commentaire          = serializers.CharField(read_only=True)

    # Stade & État
    stade_ajcc               = serializers.CharField(read_only=True)
    etat_cancer              = serializers.CharField(read_only=True)
    performance_status       = serializers.CharField(read_only=True)
    pronostic_evaluation     = serializers.CharField(read_only=True)

    # Marqueurs biologiques
    recepteur_re             = serializers.CharField(read_only=True)
    recepteur_re_pourcentage = serializers.IntegerField(read_only=True)
    recepteur_rp             = serializers.CharField(read_only=True)
    recepteur_rp_pourcentage = serializers.IntegerField(read_only=True)
    her2                     = serializers.CharField(read_only=True)
    her2_fish                = serializers.CharField(read_only=True)
    ki67                     = serializers.CharField(read_only=True)
    psa                      = serializers.CharField(read_only=True)
    cea                      = serializers.CharField(read_only=True)
    ca_19_9                  = serializers.CharField(read_only=True)
    ca_125                   = serializers.CharField(read_only=True)
    afp                      = serializers.CharField(read_only=True)
    pdl1                     = serializers.CharField(read_only=True)
    mmr_status               = serializers.CharField(read_only=True)
    autres_marqueurs         = serializers.CharField(read_only=True)

    # Imagerie & Mesures
    taille_tumeur            = serializers.DecimalField(max_digits=6, decimal_places=1, read_only=True)
    nombre_ganglions         = serializers.IntegerField(read_only=True)
    metastases_sites         = serializers.CharField(read_only=True)
    invasion_vasculaire      = serializers.BooleanField(read_only=True)
    invasion_perineurale     = serializers.BooleanField(read_only=True)

    # Anatomopathologie
    marges_chirurgicales     = serializers.CharField(read_only=True)
    emboles_lymphatiques     = serializers.BooleanField(read_only=True)
    emboles_vasculaires      = serializers.BooleanField(read_only=True)

    # Médecin & Établissement
    medecin_referent             = serializers.CharField(read_only=True)
    etablissement_diagnostic     = serializers.CharField(read_only=True)

    # CIM-10
    cim10_code               = serializers.CharField(read_only=True)
    cim10_libelle            = serializers.CharField(read_only=True)

    # Méta
    statut_dossier           = serializers.CharField(read_only=True)
    est_principal            = serializers.BooleanField(read_only=True)
    observations             = serializers.CharField(read_only=True)


# ── Médicaments ───────────────────────────────────────────────────

class MedicamentChimioSerializer(serializers.ModelSerializer):
    class Meta:
        model  = MedicamentChimio
        fields = ['id', 'dci', 'dose', 'unite_dose', 'jour_administration']


# ── CHIMIOTHÉRAPIE ────────────────────────────────────────────────

class ChimiotherapieListSerializer(serializers.ModelSerializer):
    patient_nom     = serializers.CharField(source='patient.get_full_name', read_only=True)
    patient_numero  = serializers.CharField(source='patient.registration_number', read_only=True)
    statut_label    = serializers.CharField(source='get_statut_display', read_only=True)
    intention_label = serializers.CharField(source='get_intention_display', read_only=True)
    reponse_label   = serializers.CharField(source='get_reponse_tumorale_display', read_only=True)
    voie_label      = serializers.CharField(source='get_voie_administration_display', read_only=True)
    diagnostic_info = DiagnosticResumSerializer(source='diagnostic', read_only=True)

    class Meta:
        model  = Chimiotherapie
        fields = [
            'id', 'patient', 'patient_nom', 'patient_numero',
            'diagnostic', 'diagnostic_info',
            'protocole', 'ligne', 'statut', 'statut_label',
            'intention', 'intention_label',
            'date_debut', 'date_fin',
            'nombre_cycles', 'cycles_realises',
            'voie_administration', 'voie_label',
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
    diagnostic_info = DiagnosticResumSerializer(source='diagnostic', read_only=True)

    class Meta:
        model            = Chimiotherapie
        fields           = '__all__'
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


# ── RADIOTHÉRAPIE ─────────────────────────────────────────────────

class RadiotherapieSerializer(serializers.ModelSerializer):
    statut_label    = serializers.CharField(source='get_statut_display', read_only=True)
    technique_label = serializers.CharField(source='get_technique_display', read_only=True)
    intention_label = serializers.CharField(source='get_intention_display', read_only=True)
    patient_nom     = serializers.CharField(source='patient.get_full_name', read_only=True)
    patient_numero  = serializers.CharField(source='patient.registration_number', read_only=True)
    diagnostic_info = DiagnosticResumSerializer(source='diagnostic', read_only=True)

    class Meta:
        model            = Radiotherapie
        fields           = '__all__'
        read_only_fields = ['date_creation', 'date_modification', 'cree_par']

    def create(self, validated_data):
        if self.context.get('request'):
            validated_data['cree_par'] = self.context['request'].user
        return super().create(validated_data)


# ── CHIRURGIE ─────────────────────────────────────────────────────

class ChirurgieSerializer(serializers.ModelSerializer):
    statut_label    = serializers.CharField(source='get_statut_display', read_only=True)
    type_label      = serializers.CharField(source='get_type_chirurgie_display', read_only=True)
    voie_label      = serializers.CharField(source='get_voie_abord_display', read_only=True)
    marges_label    = serializers.CharField(source='get_marges_resection_display', read_only=True)
    intention_label = serializers.CharField(source='get_intention_display', read_only=True)
    patient_nom     = serializers.CharField(source='patient.get_full_name', read_only=True)
    patient_numero  = serializers.CharField(source='patient.registration_number', read_only=True)
    diagnostic_info = DiagnosticResumSerializer(source='diagnostic', read_only=True)

    class Meta:
        model            = Chirurgie
        fields           = '__all__'
        read_only_fields = ['date_creation', 'date_modification', 'cree_par']

    def create(self, validated_data):
        if self.context.get('request'):
            validated_data['cree_par'] = self.context['request'].user
        return super().create(validated_data)


# ── HORMONOTHÉRAPIE ───────────────────────────────────────────────

class HormonotherapieSerializer(serializers.ModelSerializer):
    statut_label    = serializers.CharField(source='get_statut_display', read_only=True)
    type_label      = serializers.CharField(source='get_type_hormonotherapie_display', read_only=True)
    intention_label = serializers.CharField(source='get_intention_display', read_only=True)
    patient_nom     = serializers.CharField(source='patient.get_full_name', read_only=True)
    patient_numero  = serializers.CharField(source='patient.registration_number', read_only=True)
    diagnostic_info = DiagnosticResumSerializer(source='diagnostic', read_only=True)

    class Meta:
        model            = Hormonotherapie
        fields           = '__all__'
        read_only_fields = ['date_creation', 'date_modification', 'cree_par']

    def create(self, validated_data):
        if self.context.get('request'):
            validated_data['cree_par'] = self.context['request'].user
        return super().create(validated_data)


# ── IMMUNOTHÉRAPIE ────────────────────────────────────────────────

class ImmunotherapieSerializer(serializers.ModelSerializer):
    statut_label    = serializers.CharField(source='get_statut_display', read_only=True)
    type_label      = serializers.CharField(source='get_type_immunotherapie_display', read_only=True)
    intention_label = serializers.CharField(source='get_intention_display', read_only=True)
    patient_nom     = serializers.CharField(source='patient.get_full_name', read_only=True)
    patient_numero  = serializers.CharField(source='patient.registration_number', read_only=True)
    diagnostic_info = DiagnosticResumSerializer(source='diagnostic', read_only=True)

    class Meta:
        model            = Immunotherapie
        fields           = '__all__'
        read_only_fields = ['date_creation', 'date_modification', 'cree_par']

    def create(self, validated_data):
        if self.context.get('request'):
            validated_data['cree_par'] = self.context['request'].user
        return super().create(validated_data)
    



