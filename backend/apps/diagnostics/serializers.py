from rest_framework import serializers
from .models import Diagnostic, TopographieICD, MorphologieICD, StyleVie
from .models import DiagnosticFile

class TopographieSerializer(serializers.ModelSerializer):
    class Meta:
        model  = TopographieICD
        fields = ['id', 'code', 'libelle', 'categorie']


class MorphologieSerializer(serializers.ModelSerializer):
    comportement_label = serializers.CharField(source='get_comportement_display', read_only=True)

    class Meta:
        model  = MorphologieICD
        fields = ['id', 'code', 'libelle', 'comportement', 'comportement_label', 'groupe']


class StyleVieSerializer(serializers.ModelSerializer):
    statut_tabagique_label    = serializers.CharField(source='get_statut_tabagique_display',    read_only=True)
    consommation_alcool_label = serializers.CharField(source='get_consommation_alcool_display', read_only=True)
    niveau_activite_label     = serializers.CharField(source='get_niveau_activite_display',     read_only=True)
    qualite_sommeil_label     = serializers.CharField(source='get_qualite_sommeil_display',     read_only=True)

    class Meta:
        model            = StyleVie
        exclude          = ['diagnostic']
        read_only_fields = ['imc', 'score_risque_global']


# ─────────────────────────────────────────────────────────────────
# Serializers légers des traitements (évite import circulaire)
# ─────────────────────────────────────────────────────────────────

class MedicamentChimioInlineSerializer(serializers.Serializer):
    id                  = serializers.IntegerField(read_only=True)
    dci                 = serializers.CharField(read_only=True)
    dose                = serializers.DecimalField(max_digits=8, decimal_places=2, read_only=True)
    unite_dose          = serializers.CharField(read_only=True)
    jour_administration = serializers.CharField(read_only=True)


class ChimiotherapieInlineSerializer(serializers.Serializer):
    id                   = serializers.IntegerField(read_only=True)
    protocole            = serializers.CharField(read_only=True)
    ligne                = serializers.IntegerField(read_only=True)
    statut               = serializers.CharField(read_only=True)
    intention            = serializers.CharField(read_only=True)
    date_debut           = serializers.DateField(read_only=True)
    date_fin             = serializers.DateField(read_only=True)
    nombre_cycles        = serializers.IntegerField(read_only=True)
    cycles_realises      = serializers.IntegerField(read_only=True)
    intervalle_jours     = serializers.IntegerField(read_only=True)
    voie_administration  = serializers.CharField(read_only=True)
    reponse_tumorale     = serializers.CharField(read_only=True)
    date_evaluation      = serializers.DateField(read_only=True)
    toxicite_grade       = serializers.IntegerField(read_only=True)
    toxicite_description = serializers.CharField(read_only=True)
    medecin              = serializers.CharField(read_only=True)
    etablissement        = serializers.CharField(read_only=True)
    observations         = serializers.CharField(read_only=True)
    medicaments          = MedicamentChimioInlineSerializer(many=True, read_only=True)

    # Labels calculés
    statut_label    = serializers.SerializerMethodField()
    intention_label = serializers.SerializerMethodField()
    voie_label      = serializers.SerializerMethodField()
    reponse_label   = serializers.SerializerMethodField()

    _STATUT = {'planifie':'Planifié','en_cours':'En cours','termine':'Terminé','suspendu':'Suspendu','abandonne':'Abandonné'}
    _INTENTION = {'curatif':'Curatif','palliatif':'Palliatif','adjuvant':'Adjuvant','neo_adjuvant':'Néo-adjuvant','prophylactique':'Prophylactique'}
    _VOIE = {'iv_perf':'IV Perfusion','iv_bolus':'IV Bolus','po':'Per os','sc':'Sous-cutanée','im':'Intramusculaire','it':'Intrathécale','autre':'Autre'}
    _REPONSE = {'RC':'RC – Réponse Complète','RP':'RP – Réponse Partielle','SD':'SD – Stabilisation','PD':'PD – Progression','NE':'NE – Non Évaluable','NA':'Non Applicable'}

    def get_statut_label(self, obj):    return self._STATUT.get(obj.statut, obj.statut)
    def get_intention_label(self, obj): return self._INTENTION.get(obj.intention, obj.intention)
    def get_voie_label(self, obj):      return self._VOIE.get(obj.voie_administration, obj.voie_administration)
    def get_reponse_label(self, obj):   return self._REPONSE.get(obj.reponse_tumorale, obj.reponse_tumorale or '')


class RadiotherapieInlineSerializer(serializers.Serializer):
    id                 = serializers.IntegerField(read_only=True)
    technique          = serializers.CharField(read_only=True)
    site_irradie       = serializers.CharField(read_only=True)
    dose_totale_gy     = serializers.DecimalField(max_digits=6, decimal_places=2, read_only=True)
    dose_par_seance_gy = serializers.DecimalField(max_digits=5, decimal_places=2, read_only=True)
    nombre_seances     = serializers.IntegerField(read_only=True)
    seances_realisees  = serializers.IntegerField(read_only=True)
    energie_mev        = serializers.CharField(read_only=True)
    association_chimio = serializers.BooleanField(read_only=True)
    statut             = serializers.CharField(read_only=True)
    intention          = serializers.CharField(read_only=True)
    date_debut         = serializers.DateField(read_only=True)
    date_fin           = serializers.DateField(read_only=True)
    toxicite_aigue     = serializers.CharField(read_only=True)
    toxicite_tardive   = serializers.CharField(read_only=True)
    medecin            = serializers.CharField(read_only=True)
    etablissement      = serializers.CharField(read_only=True)
    observations       = serializers.CharField(read_only=True)

    statut_label    = serializers.SerializerMethodField()
    intention_label = serializers.SerializerMethodField()
    technique_label = serializers.SerializerMethodField()

    _STATUT    = {'planifie':'Planifié','en_cours':'En cours','termine':'Terminé','suspendu':'Suspendu','abandonne':'Abandonné'}
    _INTENTION = {'curatif':'Curatif','palliatif':'Palliatif','adjuvant':'Adjuvant','neo_adjuvant':'Néo-adjuvant','prophylactique':'Prophylactique'}
    _TECHNIQUE = {'RTE':'Radiothérapie externe','RCMI':'RCMI','STRT':'Stéréotaxie','curie':'Curiethérapie','RTE_3D':'RTE 3D','tomo':'Tomothérapie','cyber':'CyberKnife','proton':'Protonthérapie','autre':'Autre'}

    def get_statut_label(self, obj):    return self._STATUT.get(obj.statut, obj.statut)
    def get_intention_label(self, obj): return self._INTENTION.get(obj.intention, obj.intention)
    def get_technique_label(self, obj): return self._TECHNIQUE.get(obj.technique, obj.technique)


class ChirurgieInlineSerializer(serializers.Serializer):
    id                      = serializers.IntegerField(read_only=True)
    type_chirurgie          = serializers.CharField(read_only=True)
    intitule_acte           = serializers.CharField(read_only=True)
    voie_abord              = serializers.CharField(read_only=True)
    chirurgien              = serializers.CharField(read_only=True)
    marges_resection        = serializers.CharField(read_only=True)
    curage_ganglionnaire    = serializers.BooleanField(read_only=True)
    nb_ganglions_preleves   = serializers.IntegerField(read_only=True)
    nb_ganglions_envahis    = serializers.IntegerField(read_only=True)
    compte_rendu_operatoire = serializers.CharField(read_only=True)
    complications           = serializers.CharField(read_only=True)
    duree_hospitalisation   = serializers.IntegerField(read_only=True)
    statut                  = serializers.CharField(read_only=True)
    intention               = serializers.CharField(read_only=True)
    date_debut              = serializers.DateField(read_only=True)
    date_fin                = serializers.DateField(read_only=True)
    medecin                 = serializers.CharField(read_only=True)
    etablissement           = serializers.CharField(read_only=True)
    observations            = serializers.CharField(read_only=True)

    statut_label    = serializers.SerializerMethodField()
    intention_label = serializers.SerializerMethodField()
    type_label      = serializers.SerializerMethodField()
    voie_label      = serializers.SerializerMethodField()
    marges_label    = serializers.SerializerMethodField()

    _STATUT    = {'planifie':'Planifié','en_cours':'En cours','termine':'Terminé','suspendu':'Suspendu','abandonne':'Abandonné'}
    _INTENTION = {'curatif':'Curatif','palliatif':'Palliatif','adjuvant':'Adjuvant','neo_adjuvant':'Néo-adjuvant','prophylactique':'Prophylactique'}
    _TYPE      = {'curative':'Curative','palliative':'Palliative','cyto':'Cytoréductrice','recons':'Reconstructrice','diagnostic':'Diagnostique','ganglion':'Curage ganglionnaire','autre':'Autre'}
    _VOIE      = {'ouverte':'Ouverte','laparo':'Laparoscopie','thoraco':'Thoracoscopie','robot':'Robotique','endo':'Endoscopie','autre':'Autre'}
    _MARGES    = {'R0':'R0 – Saines','R1':'R1 – Microscopique','R2':'R2 – Macroscopique','RX':'RX – Non évaluable'}

    def get_statut_label(self, obj):    return self._STATUT.get(obj.statut, obj.statut)
    def get_intention_label(self, obj): return self._INTENTION.get(obj.intention, obj.intention)
    def get_type_label(self, obj):      return self._TYPE.get(obj.type_chirurgie, obj.type_chirurgie)
    def get_voie_label(self, obj):      return self._VOIE.get(obj.voie_abord, obj.voie_abord)
    def get_marges_label(self, obj):    return self._MARGES.get(obj.marges_resection, obj.marges_resection or '')


class HormonotherapieInlineSerializer(serializers.Serializer):
    id                   = serializers.IntegerField(read_only=True)
    type_hormonotherapie = serializers.CharField(read_only=True)
    molecule             = serializers.CharField(read_only=True)
    dose_mg_jour         = serializers.DecimalField(max_digits=7, decimal_places=2, read_only=True)
    duree_mois_prevue    = serializers.IntegerField(read_only=True)
    statut               = serializers.CharField(read_only=True)
    intention            = serializers.CharField(read_only=True)
    date_debut           = serializers.DateField(read_only=True)
    date_fin             = serializers.DateField(read_only=True)
    medecin              = serializers.CharField(read_only=True)
    etablissement        = serializers.CharField(read_only=True)
    observations         = serializers.CharField(read_only=True)

    statut_label    = serializers.SerializerMethodField()
    intention_label = serializers.SerializerMethodField()
    type_label      = serializers.SerializerMethodField()

    _STATUT    = {'planifie':'Planifié','en_cours':'En cours','termine':'Terminé','suspendu':'Suspendu','abandonne':'Abandonné'}
    _INTENTION = {'curatif':'Curatif','palliatif':'Palliatif','adjuvant':'Adjuvant','neo_adjuvant':'Néo-adjuvant','prophylactique':'Prophylactique'}
    _TYPE      = {'anti_estro':'Anti-estrogène','anti_andro':'Anti-androgène','aromatase':'Inhibiteur aromatase','lhrh':'Analogue LH-RH','progest':'Progestatif','autre':'Autre'}

    def get_statut_label(self, obj):    return self._STATUT.get(obj.statut, obj.statut)
    def get_intention_label(self, obj): return self._INTENTION.get(obj.intention, obj.intention)
    def get_type_label(self, obj):      return self._TYPE.get(obj.type_hormonotherapie, obj.type_hormonotherapie)


class ImmunotherapieInlineSerializer(serializers.Serializer):
    id                  = serializers.IntegerField(read_only=True)
    type_immunotherapie = serializers.CharField(read_only=True)
    molecule            = serializers.CharField(read_only=True)
    dose                = serializers.CharField(read_only=True)
    nombre_cycles       = serializers.IntegerField(read_only=True)
    biomarqueur_cible   = serializers.CharField(read_only=True)
    reponse_tumorale    = serializers.CharField(read_only=True)
    statut              = serializers.CharField(read_only=True)
    intention           = serializers.CharField(read_only=True)
    date_debut          = serializers.DateField(read_only=True)
    date_fin            = serializers.DateField(read_only=True)
    medecin             = serializers.CharField(read_only=True)
    etablissement       = serializers.CharField(read_only=True)
    observations        = serializers.CharField(read_only=True)

    statut_label    = serializers.SerializerMethodField()
    intention_label = serializers.SerializerMethodField()
    type_label      = serializers.SerializerMethodField()

    _STATUT    = {'planifie':'Planifié','en_cours':'En cours','termine':'Terminé','suspendu':'Suspendu','abandonne':'Abandonné'}
    _INTENTION = {'curatif':'Curatif','palliatif':'Palliatif','adjuvant':'Adjuvant','neo_adjuvant':'Néo-adjuvant','prophylactique':'Prophylactique'}
    _TYPE      = {'checkpoint':'Inhibiteur checkpoint','anti_her2':'Anti-HER2','anti_vegf':'Anti-VEGF','anti_egfr':'Anti-EGFR','imatinib':'Tyrosine kinase','cart':'CAR-T Cell','autre':'Autre'}

    def get_statut_label(self, obj):    return self._STATUT.get(obj.statut, obj.statut)
    def get_intention_label(self, obj): return self._INTENTION.get(obj.intention, obj.intention)
    def get_type_label(self, obj):      return self._TYPE.get(obj.type_immunotherapie, obj.type_immunotherapie)


# ─────────────────────────────────────────────────────────────────
# Mixin statut traitement
# ─────────────────────────────────────────────────────────────────

TRAITEMENT_RELATED = [
    'chimiotherapie_set',
    'radiotherapie_set',
    'chirurgie_set',
    'hormonotherapie_set',
    'immunotherapie_set',
]

STATUT_PRIORITE = ['termine', 'en_cours', 'suspendu', 'planifie', 'abandonne']


class StatutTraitementMixin:
    def _get_all_statuts(self, obj):
        statuts = []
        for rel in TRAITEMENT_RELATED:
            manager = getattr(obj, rel, None)
            if manager is None:
                continue
            try:
                statuts.extend(manager.values_list('statut', flat=True))
            except Exception:
                continue
        return statuts

    def get_statut_traitement(self, obj):
        statuts = self._get_all_statuts(obj)
        if not statuts:
            return 'non_traite'
        for s in STATUT_PRIORITE:
            if s in statuts:
                return 'traite' if s == 'termine' else s
        return 'non_traite'

    def get_statut_traitement_label(self, obj):
        mapping = {
            'traite':     'Traité',
            'en_cours':   'En cours',
            'suspendu':   'Suspendu',
            'planifie':   'Planifié',
            'non_traite': 'Non traité',
        }
        return mapping.get(self.get_statut_traitement(obj), 'Non traité')

    def get_nb_traitements(self, obj):
        total = 0
        for rel in TRAITEMENT_RELATED:
            manager = getattr(obj, rel, None)
            if manager is None:
                continue
            try:
                total += manager.count()
            except Exception:
                continue
        return total


# ─────────────────────────────────────────────────────────────────
# DiagnosticListSerializer
# ─────────────────────────────────────────────────────────────────

class DiagnosticListSerializer(StatutTraitementMixin, serializers.ModelSerializer):
    patient_nom           = serializers.CharField(source='patient.get_full_name',          read_only=True)
    patient_numero        = serializers.CharField(source='patient.registration_number',    read_only=True)
    tnm_complet           = serializers.CharField(source='get_tnm_display_full',           read_only=True)
    stade_label           = serializers.CharField(source='get_stade_ajcc_display',         read_only=True)
    base_diag_label       = serializers.CharField(source='get_base_diagnostic_display',    read_only=True)
    lateralite_label      = serializers.CharField(source='get_lateralite_display',         read_only=True)
    grade_label           = serializers.CharField(source='get_grade_histologique_display', read_only=True)
    type_diag_label       = serializers.CharField(source='get_type_diagnostic_display',    read_only=True)
    etat_cancer_label     = serializers.CharField(source='get_etat_cancer_display',        read_only=True)

    statut_traitement       = serializers.SerializerMethodField()
    statut_traitement_label = serializers.SerializerMethodField()
    nb_traitements          = serializers.SerializerMethodField()

    class Meta:
        model  = Diagnostic
        fields = [
            'id', 'patient', 'patient_nom', 'patient_numero',
            'date_diagnostic', 'type_diagnostic', 'type_diag_label',
            'topographie_code', 'topographie_libelle',
            'morphologie_code', 'morphologie_libelle',
            'lateralite', 'lateralite_label',
            'grade_histologique', 'grade_label',
            'tnm_t', 'tnm_n', 'tnm_m', 'tnm_type', 'tnm_complet',
            'stade_ajcc', 'stade_label',
            'etat_cancer', 'etat_cancer_label',
            'base_diagnostic', 'base_diag_label',
            'statut_dossier', 'est_principal', 'date_creation',
            'statut_traitement', 'statut_traitement_label', 'nb_traitements',
        ]


# ─────────────────────────────────────────────────────────────────
# DiagnosticDetailSerializer  ← ENRICHI avec les traitements
# ─────────────────────────────────────────────────────────────────

class DiagnosticDetailSerializer(StatutTraitementMixin, serializers.ModelSerializer):
    patient_nom             = serializers.CharField(source='patient.get_full_name',             read_only=True)
    patient_numero          = serializers.CharField(source='patient.registration_number',       read_only=True)
    tnm_complet             = serializers.CharField(source='get_tnm_display_full',              read_only=True)
    stade_label             = serializers.CharField(source='get_stade_ajcc_display',            read_only=True)
    base_diag_label         = serializers.CharField(source='get_base_diagnostic_display',       read_only=True)
    lateralite_label        = serializers.CharField(source='get_lateralite_display',            read_only=True)
    grade_label             = serializers.CharField(source='get_grade_histologique_display',    read_only=True)
    type_diag_label         = serializers.CharField(source='get_type_diagnostic_display',       read_only=True)
    etat_cancer_label       = serializers.CharField(source='get_etat_cancer_display',           read_only=True)
    perf_status_label       = serializers.CharField(source='get_performance_status_display',    read_only=True)
    topographie_info        = TopographieSerializer(source='topographie',                       read_only=True)
    morphologie_info        = MorphologieSerializer(source='morphologie',                       read_only=True)
    style_vie               = StyleVieSerializer(read_only=True)

    statut_traitement       = serializers.SerializerMethodField()
    statut_traitement_label = serializers.SerializerMethodField()
    nb_traitements          = serializers.SerializerMethodField()

    # ── Traitements liés (injectés seulement si le diag est traité) ──
    chimiotherapies  = serializers.SerializerMethodField()
    radiotherapies   = serializers.SerializerMethodField()
    chirurgies       = serializers.SerializerMethodField()
    hormonotherapies = serializers.SerializerMethodField()
    immunotherapies  = serializers.SerializerMethodField()

    def get_chimiotherapies(self, obj):
        qs = getattr(obj, 'chimiotherapie_set', None)
        if qs is None:
            return []
        return ChimiotherapieInlineSerializer(
            qs.prefetch_related('medicaments'), many=True
        ).data

    def get_radiotherapies(self, obj):
        qs = getattr(obj, 'radiotherapie_set', None)
        return RadiotherapieInlineSerializer(qs, many=True).data if qs is not None else []

    def get_chirurgies(self, obj):
        qs = getattr(obj, 'chirurgie_set', None)
        return ChirurgieInlineSerializer(qs, many=True).data if qs is not None else []

    def get_hormonotherapies(self, obj):
        qs = getattr(obj, 'hormonotherapie_set', None)
        return HormonotherapieInlineSerializer(qs, many=True).data if qs is not None else []

    def get_immunotherapies(self, obj):
        qs = getattr(obj, 'immunotherapie_set', None)
        return ImmunotherapieInlineSerializer(qs, many=True).data if qs is not None else []

    class Meta:
        model            = Diagnostic
        fields           = '__all__'
        read_only_fields = [
            'date_creation', 'date_modification', 'cree_par',
            'topographie_code', 'topographie_libelle',
            'morphologie_code', 'morphologie_libelle',
        ]


# ─────────────────────────────────────────────────────────────────
# DiagnosticCreateSerializer
# ─────────────────────────────────────────────────────────────────

class DiagnosticCreateSerializer(serializers.ModelSerializer):
    style_vie = StyleVieSerializer(required=False)

    class Meta:
        model   = Diagnostic
        exclude = [
            'cree_par', 'modifie_par', 'date_creation', 'date_modification',
            'topographie_code', 'topographie_libelle',
            'morphologie_code', 'morphologie_libelle',
        ]

    def create(self, validated_data):
        style_vie_data = validated_data.pop('style_vie', None)
        request = self.context.get('request')
        if request and request.user:
            validated_data['cree_par'] = request.user
        diag = super().create(validated_data)
        if style_vie_data:
            StyleVie.objects.create(diagnostic=diag, **style_vie_data)
        return diag

    def update(self, instance, validated_data):
        style_vie_data = validated_data.pop('style_vie', None)
        request = self.context.get('request')
        if request and request.user:
            validated_data['modifie_par'] = request.user
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if style_vie_data is not None:
            StyleVie.objects.update_or_create(diagnostic=instance, defaults=style_vie_data)
        return instance
    
class DiagnosticFileSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = DiagnosticFile
        fields = [
            'id',
            'nom',
            'taille',
            'created_at',
            'url',
        ]

    def get_url(self, obj):
        request = self.context.get('request')
        if obj.fichier and request:
            return request.build_absolute_uri(obj.fichier.url)
        return None