from django.db import models
from django.contrib.auth import get_user_model
from apps.patients.models import Patient

User = get_user_model()


# ─────────────────────────────────────────────────────────────────────────────
# Référentiels ICD-O-3
# ─────────────────────────────────────────────────────────────────────────────

class TopographieICD(models.Model):
    """Topographie ICD-O-3 : localisation anatomique du cancer."""
    code        = models.CharField(max_length=10, unique=True)   # ex: C50.1
    libelle     = models.CharField(max_length=200)
    libelle_ar  = models.CharField(max_length=200, blank=True)
    categorie   = models.CharField(max_length=100, blank=True)   # ex: Sein
    est_actif   = models.BooleanField(default=True)

    class Meta:
        db_table = 'topographie_icd'
        ordering = ['code']
        verbose_name = 'Topographie ICD-O-3'

    def __str__(self):
        return f"{self.code} – {self.libelle}"


class MorphologieICD(models.Model):
    """Morphologie ICD-O-3 : type histologique de la tumeur."""
    code        = models.CharField(max_length=10, unique=True)   # ex: 8500/3
    libelle     = models.CharField(max_length=200)
    libelle_ar  = models.CharField(max_length=200, blank=True)
    comportement = models.CharField(
        max_length=1,
        choices=[
            ('0', 'Bénin'),
            ('1', 'Incertain'),
            ('2', 'In situ'),
            ('3', 'Malin primitif'),
            ('6', 'Malin métastatique'),
        ],
        default='3'
    )
    groupe      = models.CharField(max_length=100, blank=True)   # ex: Carcinome
    est_actif   = models.BooleanField(default=True)

    class Meta:
        db_table = 'morphologie_icd'
        ordering = ['code']
        verbose_name = 'Morphologie ICD-O-3'

    def __str__(self):
        return f"{self.code} – {self.libelle}"


# ─────────────────────────────────────────────────────────────────────────────
# Diagnostic principal
# ─────────────────────────────────────────────────────────────────────────────

class Diagnostic(models.Model):
    """
    Fiche de diagnostic oncologique conforme CanReg5.
    Inclut topographie ICD-O-3, morphologie, classification TNM 8e éd.,
    stade AJCC/UICC, et base du diagnostic.
    """

    class Lateralite(models.TextChoices):
        NON_APPLICABLE = '0', 'Non applicable'
        DROIT          = '1', 'Droit'
        GAUCHE         = '2', 'Gauche'
        BILATERAL      = '3', 'Bilatéral'
        INCONNU        = '9', 'Inconnu'

    class BaseDiagnostic(models.TextChoices):
        CLINIQUE_SEUL     = '0', 'Clinique seul'
        CLINIQUE_EXAMENS  = '1', 'Clinique + examens paracliniques'
        CHIRURGIE         = '2', 'Chirurgie / autopsie sans histologie'
        BIOCHIMIE         = '4', 'Marqueurs biochimiques / immunologiques'
        CYTOLOGIE         = '5', 'Cytologie'
        HISTOLOGIE_META   = '6', 'Histologie de métastase'
        HISTOLOGIE_PRIM   = '7', 'Histologie de tumeur primitive'
        INCONNU           = '9', 'Inconnu'

    class GradeHistologique(models.TextChoices):
        GRADE_I   = 'I',   'Grade I – bien différencié'
        GRADE_II  = 'II',  'Grade II – moyennement différencié'
        GRADE_III = 'III', 'Grade III – peu différencié'
        GRADE_IV  = 'IV',  'Grade IV – indifférencié'
        INCONNU   = 'U',   'Inconnu / non applicable'

    class StadeAJCC(models.TextChoices):
        STADE_0    = '0',    'Stade 0 – In situ'
        STADE_I    = 'I',    'Stade I'
        STADE_IA   = 'IA',   'Stade IA'
        STADE_IB   = 'IB',   'Stade IB'
        STADE_II   = 'II',   'Stade II'
        STADE_IIA  = 'IIA',  'Stade IIA'
        STADE_IIB  = 'IIB',  'Stade IIB'
        STADE_IIC  = 'IIC',  'Stade IIC'
        STADE_III  = 'III',  'Stade III'
        STADE_IIIA = 'IIIA', 'Stade IIIA'
        STADE_IIIB = 'IIIB', 'Stade IIIB'
        STADE_IIIC = 'IIIC', 'Stade IIIC'
        STADE_IV   = 'IV',   'Stade IV'
        INCONNU    = 'U',    'Inconnu'

    # ── Relations ────────────────────────────────────────────────
    patient = models.ForeignKey(
        Patient, on_delete=models.CASCADE, related_name='diagnostics'
    )

    # ── Date & Source ────────────────────────────────────────────
    date_diagnostic    = models.DateField()
    date_premier_symptome = models.DateField(null=True, blank=True)
    base_diagnostic    = models.CharField(
        max_length=1, choices=BaseDiagnostic.choices, default='9'
    )

    # ── Topographie ICD-O-3 ──────────────────────────────────────
    topographie        = models.ForeignKey(
        TopographieICD, on_delete=models.PROTECT, null=True, blank=True,
        related_name='diagnostics'
    )
    topographie_code   = models.CharField(max_length=10, blank=True)   # sauvegarde texte
    topographie_libelle= models.CharField(max_length=200, blank=True)
    lateralite         = models.CharField(
        max_length=1, choices=Lateralite.choices, default='0'
    )

    # ── Morphologie ICD-O-3 ──────────────────────────────────────
    morphologie        = models.ForeignKey(
        MorphologieICD, on_delete=models.PROTECT, null=True, blank=True,
        related_name='diagnostics'
    )
    morphologie_code   = models.CharField(max_length=10, blank=True)
    morphologie_libelle= models.CharField(max_length=200, blank=True)
    grade_histologique = models.CharField(
        max_length=3, choices=GradeHistologique.choices, default='U'
    )

    # ── Classification TNM 8e édition ────────────────────────────
    # T = Tumeur primitive
    tnm_t = models.CharField(
        max_length=5, blank=True,
        choices=[
            ('TX', 'TX – Non évaluable'),
            ('T0', 'T0 – Pas de tumeur'),
            ('Tis', 'Tis – In situ'),
            ('T1', 'T1'), ('T1a', 'T1a'), ('T1b', 'T1b'), ('T1c', 'T1c'),
            ('T2', 'T2'), ('T2a', 'T2a'), ('T2b', 'T2b'),
            ('T3', 'T3'), ('T3a', 'T3a'),
            ('T4', 'T4'), ('T4a', 'T4a'), ('T4b', 'T4b'), ('T4c', 'T4c'), ('T4d', 'T4d'),
        ]
    )
    # N = Ganglions régionaux
    tnm_n = models.CharField(
        max_length=5, blank=True,
        choices=[
            ('NX', 'NX – Non évaluable'),
            ('N0', 'N0 – Pas de métastase'),
            ('N1', 'N1'), ('N1a', 'N1a'), ('N1b', 'N1b'), ('N1c', 'N1c'),
            ('N2', 'N2'), ('N2a', 'N2a'), ('N2b', 'N2b'), ('N2c', 'N2c'),
            ('N3', 'N3'), ('N3a', 'N3a'), ('N3b', 'N3b'), ('N3c', 'N3c'),
        ]
    )
    # M = Métastases à distance
    tnm_m = models.CharField(
        max_length=5, blank=True,
        choices=[
            ('MX', 'MX – Non évaluable'),
            ('M0', 'M0 – Pas de métastase'),
            ('M1', 'M1 – Métastase à distance'),
            ('M1a', 'M1a'), ('M1b', 'M1b'), ('M1c', 'M1c'),
        ]
    )
    tnm_edition     = models.CharField(max_length=5, default='8', blank=True)
    tnm_type        = models.CharField(
        max_length=1,
        choices=[('c', 'cTNM – Clinique'), ('p', 'pTNM – Pathologique'), ('y', 'yTNM – Post-thérapeutique')],
        default='c'
    )

    # ── Stade AJCC/UICC ─────────────────────────────────────────
    stade_ajcc = models.CharField(
        max_length=5, choices=StadeAJCC.choices, default='U'
    )

    # ── Marqueurs biologiques ────────────────────────────────────
    # Récepteurs hormonaux (sein, utérus, etc.)
    recepteur_re  = models.CharField(
        max_length=10, blank=True,
        choices=[('positif', 'Positif'), ('negatif', 'Négatif'), ('inconnu', 'Inconnu')]
    )
    recepteur_rp  = models.CharField(
        max_length=10, blank=True,
        choices=[('positif', 'Positif'), ('negatif', 'Négatif'), ('inconnu', 'Inconnu')]
    )
    her2          = models.CharField(
        max_length=10, blank=True,
        choices=[
            ('positif', 'Positif (3+)'),
            ('equivoque', 'Équivoque (2+)'),
            ('negatif', 'Négatif (0/1+)'),
            ('inconnu', 'Inconnu'),
        ]
    )
    ki67          = models.CharField(max_length=20, blank=True, help_text="% Ki67")
    psa           = models.CharField(max_length=20, blank=True, help_text="PSA ng/mL")
    autres_marqueurs = models.TextField(blank=True)

    # ── Imagerie & Bilan ─────────────────────────────────────────
    taille_tumeur    = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True, help_text="mm")
    nombre_ganglions = models.PositiveSmallIntegerField(null=True, blank=True)
    metastases_sites = models.CharField(max_length=300, blank=True, help_text="Sites métastatiques")

    # ── Établissement diagnostiqueur ─────────────────────────────
    etablissement_diagnostic = models.CharField(max_length=200, blank=True)
    medecin_diagnostiqueur   = models.CharField(max_length=150, blank=True)
    numero_bloc_anapath      = models.CharField(max_length=50, blank=True)

    # ── CIM-10 (pour codage hospitalier) ─────────────────────────
    cim10_code    = models.CharField(max_length=10, blank=True)
    cim10_libelle = models.CharField(max_length=200, blank=True)

    # ── Statut & Métadonnées ─────────────────────────────────────
    est_principal  = models.BooleanField(default=True, help_text="Diagnostic principal")
    observations   = models.TextField(blank=True)
    date_creation  = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)
    cree_par       = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name='diagnostics_crees'
    )

    class Meta:
        db_table = 'diagnostics'
        ordering = ['-date_diagnostic']
        verbose_name = 'Diagnostic'
        verbose_name_plural = 'Diagnostics'

    def __str__(self):
        return f"[{self.patient.registration_number}] {self.topographie_code} – {self.date_diagnostic}"

    def get_tnm_display_full(self):
        """Retourne le TNM complet formaté ex: cT2N1M0"""
        parts = []
        if self.tnm_t: parts.append(self.tnm_t)
        if self.tnm_n: parts.append(self.tnm_n)
        if self.tnm_m: parts.append(self.tnm_m)
        prefix = self.tnm_type if self.tnm_type else ''
        return prefix + ''.join(parts) if parts else '—'

    def save(self, *args, **kwargs):
        # Dénormalisation pour performances
        if self.topographie:
            self.topographie_code    = self.topographie.code
            self.topographie_libelle = self.topographie.libelle
        if self.morphologie:
            self.morphologie_code    = self.morphologie.code
            self.morphologie_libelle = self.morphologie.libelle
        super().save(*args, **kwargs)
