from django.db import models
from django.contrib.auth import get_user_model
from apps.patients.models import Patient
from apps.diagnostics.models import Diagnostic

User = get_user_model()


class TraitementBase(models.Model):
    """
    Modèle abstrait commun à tous les types de traitement.
    """

    class Statut(models.TextChoices):
        PLANIFIE   = 'planifie',   'Planifié'
        EN_COURS   = 'en_cours',   'En cours'
        TERMINE    = 'termine',    'Terminé'
        SUSPENDU   = 'suspendu',   'Suspendu'
        ABANDONNE  = 'abandonne',  'Abandonné'

    class Intention(models.TextChoices):
        CURATIF     = 'curatif',    'Curatif'
        PALLIATIF   = 'palliatif',  'Palliatif'
        ADJUVANT    = 'adjuvant',   'Adjuvant'
        NEO_ADJUVANT= 'neo_adjuvant','Néo-adjuvant'
        PROPHYLACTIQUE = 'prophylactique', 'Prophylactique'

    patient     = models.ForeignKey(Patient, on_delete=models.CASCADE)
    diagnostic  = models.ForeignKey(Diagnostic, on_delete=models.SET_NULL, null=True, blank=True)
    statut      = models.CharField(max_length=20, choices=Statut.choices, default='planifie')
    intention   = models.CharField(max_length=20, choices=Intention.choices, default='curatif')
    date_debut  = models.DateField()
    date_fin    = models.DateField(null=True, blank=True)
    etablissement = models.CharField(max_length=200, blank=True)
    medecin       = models.CharField(max_length=150, blank=True)
    observations  = models.TextField(blank=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)
    cree_par = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

    class Meta:
        abstract = True


# ─────────────────────────────────────────────────────────────────
# 1. CHIMIOTHÉRAPIE
# ─────────────────────────────────────────────────────────────────

class Chimiotherapie(TraitementBase):

    class Voie(models.TextChoices):
        IV_PERF   = 'iv_perf',   'IV Perfusion'
        IV_BOLUS  = 'iv_bolus',  'IV Bolus'
        PO        = 'po',        'Per os (oral)'
        SC        = 'sc',        'Sous-cutanée'
        IM        = 'im',        'Intramusculaire'
        IT        = 'it',        'Intrathécale'
        AUTRE     = 'autre',     'Autre'

    class Reponse(models.TextChoices):
        RC   = 'RC',  'RC – Réponse Complète'
        RP   = 'RP',  'RP – Réponse Partielle'
        SD   = 'SD',  'SD – Stabilisation'
        PD   = 'PD',  'PD – Progression'
        NE   = 'NE',  'NE – Non Évaluable'
        NA   = 'NA',  'Non Applicable'

    # Protocole
    protocole        = models.CharField(max_length=100, blank=True,
                         help_text="Ex: AC-T, FOLFOX, BEP, R-CHOP")
    ligne            = models.PositiveSmallIntegerField(default=1,
                         help_text="Ligne de traitement (1ère, 2ème...)")
    nombre_cycles    = models.PositiveSmallIntegerField(null=True, blank=True)
    cycles_realises  = models.PositiveSmallIntegerField(default=0)
    intervalle_jours = models.PositiveSmallIntegerField(null=True, blank=True,
                         help_text="Jours entre cycles")
    voie_administration = models.CharField(max_length=20, choices=Voie.choices, default='iv_perf')

    # Réponse
    reponse_tumorale = models.CharField(max_length=5, choices=Reponse.choices, blank=True)
    date_evaluation  = models.DateField(null=True, blank=True)

    # Toxicité
    toxicite_grade   = models.PositiveSmallIntegerField(
        null=True, blank=True,
        choices=[(0,'0'),(1,'1 – Légère'),(2,'2 – Modérée'),(3,'3 – Sévère'),(4,'4 – Engageant le pronostic vital'),(5,'5 – Décès')],
    )
    toxicite_description = models.TextField(blank=True)

    class Meta:
        db_table  = 'chimiotherapies'
        ordering  = ['-date_debut']
        verbose_name = 'Chimiothérapie'
        verbose_name_plural = 'Chimiothérapies'

    def __str__(self):
        return f"[{self.patient.registration_number}] Chimio {self.protocole or 'N/A'} L{self.ligne}"


class MedicamentChimio(models.Model):
    """Médicaments d'un cycle de chimiothérapie."""
    chimiotherapie = models.ForeignKey(Chimiotherapie, on_delete=models.CASCADE, related_name='medicaments')
    dci            = models.CharField(max_length=100, help_text="Dénomination Commune Internationale")
    dose           = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    unite_dose     = models.CharField(max_length=20, blank=True,
                       choices=[('mg/m2','mg/m²'),('mg/kg','mg/kg'),('mg','mg'),('AUC','AUC'),('UI','UI')])
    jour_administration = models.CharField(max_length=50, blank=True, help_text="Ex: J1, J1-J5, J1,J8")

    class Meta:
        db_table = 'medicaments_chimio'

    def __str__(self):
        return f"{self.dci} {self.dose} {self.unite_dose}"


# ─────────────────────────────────────────────────────────────────
# 2. RADIOTHÉRAPIE
# ─────────────────────────────────────────────────────────────────

class Radiotherapie(TraitementBase):

    class Technique(models.TextChoices):
        RTE      = 'RTE',    'Radiothérapie externe (RTE)'
        RCMI     = 'RCMI',   'Radiothérapie conformationnelle avec modulation d\'intensité (RCMI)'
        STRT     = 'STRT',   'Stéréotaxie (SBRT/SRST)'
        CURIE    = 'curie',  'Curiethérapie'
        RTE_3D   = 'RTE_3D', 'RTE conformationnelle 3D'
        TOMOTHE  = 'tomo',   'Tomothérapie'
        CYBERKNIFE = 'cyber','CyberKnife'
        PROTON   = 'proton', 'Protonthérapie'
        AUTRE    = 'autre',  'Autre'

    technique           = models.CharField(max_length=20, choices=Technique.choices, default='RTE')
    site_irradie        = models.CharField(max_length=200)
    dose_totale_gy      = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True,
                            help_text="Dose totale en Gray")
    dose_par_seance_gy  = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True,
                            help_text="Dose par séance en Gray")
    nombre_seances      = models.PositiveSmallIntegerField(null=True, blank=True)
    seances_realisees   = models.PositiveSmallIntegerField(default=0)
    energie_mev         = models.CharField(max_length=20, blank=True, help_text="Ex: 6MV, 15MV, 18MV")
    association_chimio  = models.BooleanField(default=False, help_text="Radiochimiothérapie concomitante")
    toxicite_aigue      = models.TextField(blank=True)
    toxicite_tardive    = models.TextField(blank=True)

    class Meta:
        db_table = 'radiotherapies'
        ordering = ['-date_debut']
        verbose_name = 'Radiothérapie'
        verbose_name_plural = 'Radiothérapies'

    def __str__(self):
        return f"[{self.patient.registration_number}] Radio {self.site_irradie}"


# ─────────────────────────────────────────────────────────────────
# 3. CHIRURGIE
# ─────────────────────────────────────────────────────────────────

class Chirurgie(TraitementBase):

    class TypeChirurgie(models.TextChoices):
        CURATIVE       = 'curative',    'Chirurgie curative'
        PALLIATIVE     = 'palliative',  'Chirurgie palliative'
        CYTO_REDUCTRICE= 'cyto',        'Chirurgie cytoréductrice'
        RECONSTRUCTRICE= 'recons',      'Chirurgie reconstructrice'
        DIAGNOSTIC     = 'diagnostic',  'Chirurgie diagnostique / biopsie'
        GANGLION       = 'ganglion',    'Curage ganglionnaire'
        AUTRE          = 'autre',       'Autre'

    class Voie(models.TextChoices):
        OUVERTE       = 'ouverte',     'Chirurgie ouverte'
        LAPAROSCOPIE  = 'laparo',      'Laparoscopie'
        THORACOSCOPIE = 'thoraco',     'Thoracoscopie'
        ROBOT         = 'robot',       'Chirurgie robotique'
        ENDOSCOPIE    = 'endo',        'Endoscopie'
        AUTRE         = 'autre',       'Autre'

    class MargesResection(models.TextChoices):
        R0   = 'R0', 'R0 – Résection complète (marges saines)'
        R1   = 'R1', 'R1 – Résection microscopiquement incomplète'
        R2   = 'R2', 'R2 – Résection macroscopiquement incomplète'
        RX   = 'RX', 'RX – Non évaluable'

    type_chirurgie     = models.CharField(max_length=20, choices=TypeChirurgie.choices, default='curative')
    intitule_acte      = models.CharField(max_length=300, help_text="Ex: Mastectomie totale gauche + GS")
    voie_abord         = models.CharField(max_length=20, choices=Voie.choices, default='ouverte')
    chirurgien         = models.CharField(max_length=150, blank=True)
    marges_resection   = models.CharField(max_length=5, choices=MargesResection.choices, blank=True)
    curage_ganglionnaire = models.BooleanField(default=False)
    nb_ganglions_preleves = models.PositiveSmallIntegerField(null=True, blank=True)
    nb_ganglions_envahis  = models.PositiveSmallIntegerField(null=True, blank=True)
    compte_rendu_operatoire = models.TextField(blank=True)
    complications      = models.TextField(blank=True)
    duree_hospitalisation = models.PositiveSmallIntegerField(null=True, blank=True,
                              help_text="Durée en jours")

    class Meta:
        db_table = 'chirurgies'
        ordering = ['-date_debut']
        verbose_name = 'Chirurgie'
        verbose_name_plural = 'Chirurgies'

    def __str__(self):
        return f"[{self.patient.registration_number}] Chir. {self.intitule_acte[:50]}"


# ─────────────────────────────────────────────────────────────────
# 4. HORMONOTHÉRAPIE
# ─────────────────────────────────────────────────────────────────

class Hormonotherapie(TraitementBase):

    class TypeHormono(models.TextChoices):
        ANTI_ESTROGENE  = 'anti_estro', 'Anti-estrogène (Tamoxifène)'
        ANTI_ANDROGENE  = 'anti_andro', 'Anti-androgène'
        AROMATASE       = 'aromatase',  'Inhibiteur de l\'aromatase'
        LH_RH           = 'lhrh',       'Analogue LH-RH'
        PROGESTATIF     = 'progest',    'Progestatif'
        AUTRE           = 'autre',      'Autre'

    type_hormonotherapie = models.CharField(max_length=20, choices=TypeHormono.choices)
    molecule             = models.CharField(max_length=100, help_text="DCI ex: Tamoxifène, Anastrozole")
    dose_mg_jour         = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True)
    duree_mois_prevue    = models.PositiveSmallIntegerField(null=True, blank=True)

    class Meta:
        db_table = 'hormonotherapies'
        ordering = ['-date_debut']
        verbose_name = 'Hormonothérapie'
        verbose_name_plural = 'Hormonothérapies'

    def __str__(self):
        return f"[{self.patient.registration_number}] Hormono {self.molecule}"


# ─────────────────────────────────────────────────────────────────
# 5. IMMUNOTHÉRAPIE / THÉRAPIE CIBLÉE
# ─────────────────────────────────────────────────────────────────

class Immunotherapie(TraitementBase):

    class TypeImmuno(models.TextChoices):
        CHECKPOINT     = 'checkpoint',  'Inhibiteur de checkpoint'
        ANTI_HER2      = 'anti_her2',   'Anti-HER2 (Trastuzumab...)'
        ANTI_VEGF      = 'anti_vegf',   'Anti-VEGF (Bevacizumab...)'
        ANTI_EGFR      = 'anti_egfr',   'Anti-EGFR (Cetuximab...)'
        IMATINIB       = 'imatinib',    'Inhibiteur de tyrosine kinase'
        CAR_T          = 'cart',        'CAR-T Cell'
        AUTRE          = 'autre',       'Autre'

    type_immunotherapie = models.CharField(max_length=20, choices=TypeImmuno.choices)
    molecule            = models.CharField(max_length=100, help_text="DCI ex: Pembrolizumab, Trastuzumab")
    dose                = models.CharField(max_length=50, blank=True)
    nombre_cycles       = models.PositiveSmallIntegerField(null=True, blank=True)
    biomarqueur_cible   = models.CharField(max_length=100, blank=True,
                            help_text="Ex: PDL1, HER2, EGFR, BRAF")
    reponse_tumorale    = models.CharField(
        max_length=5, blank=True,
        choices=[('RC','RC'),('RP','RP'),('SD','SD'),('PD','PD'),('NE','NE')]
    )

    class Meta:
        db_table = 'immunotherapies'
        ordering = ['-date_debut']
        verbose_name = 'Immunothérapie / Thérapie ciblée'
        verbose_name_plural = 'Immunothérapies / Thérapies ciblées'

    def __str__(self):
        return f"[{self.patient.registration_number}] Immuno {self.molecule}"
