from django.db import models
from django.contrib.auth import get_user_model
from apps.patients.models import Patient
from apps.diagnostics.models import Diagnostic

User = get_user_model()


# ─────────────────────────────────────────────────────────────────
# 1. CONSULTATION DE SUIVI
# ─────────────────────────────────────────────────────────────────

class ConsultationSuivi(models.Model):
    """Consultation de suivi oncologique."""

    class TypeConsultation(models.TextChoices):
        SUIVI_STANDARD  = 'suivi',       'Suivi standard'
        POST_TRAITEMENT = 'post_trt',    'Post-traitement'
        URGENCE         = 'urgence',     'Urgence'
        BILAN           = 'bilan',       'Bilan d\'extension'
        ANNONCE         = 'annonce',     'Consultation d\'annonce'
        PALLIATIVE      = 'palliative',  'Soins palliatifs'
        PSYCHO_ONCO     = 'psycho',      'Psycho-oncologie'
        DIETETIQUE      = 'dietet',      'Diététique'

    class StatutConsultation(models.TextChoices):
        PLANIFIEE  = 'planifiee',  'Planifiée'
        REALISEE   = 'realisee',   'Réalisée'
        ANNULEE    = 'annulee',    'Annulée'
        REPORTEE   = 'reportee',   'Reportée'

    class EvolutionMaladie(models.TextChoices):
        STABLE      = 'stable',     'Stable'
        REGRESSION  = 'regression', 'Régression'
        PROGRESSION = 'progression','Progression'
        REMISSION   = 'remission',  'Rémission complète'
        INCONNU     = 'inconnu',    'Non évaluable'

    patient         = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='consultations')
    diagnostic      = models.ForeignKey(Diagnostic, on_delete=models.SET_NULL, null=True, blank=True)
    type_consultation = models.CharField(max_length=20, choices=TypeConsultation.choices, default='suivi')
    statut          = models.CharField(max_length=20, choices=StatutConsultation.choices, default='planifiee')
    date_consultation = models.DateField()
    medecin         = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='consultations_realisees')
    etablissement   = models.CharField(max_length=200, blank=True)

    # Clinique
    poids_kg        = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True)
    taille_cm       = models.PositiveSmallIntegerField(null=True, blank=True)
    imc             = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    ta_systolique   = models.PositiveSmallIntegerField(null=True, blank=True, help_text="Tension artérielle systolique mmHg")
    ta_diastolique  = models.PositiveSmallIntegerField(null=True, blank=True, help_text="Tension artérielle diastolique mmHg")
    temperature     = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    frequence_cardiaque = models.PositiveSmallIntegerField(null=True, blank=True)

    # Performance status
    ps_ecog         = models.PositiveSmallIntegerField(
        null=True, blank=True,
        choices=[(0,'PS 0 – Asymptomatique'),
                 (1,'PS 1 – Symptomatique, activité normale'),
                 (2,'PS 2 – Symptomatique, alité <50% de la journée'),
                 (3,'PS 3 – Alité >50% de la journée'),
                 (4,'PS 4 – Grabataire')],
    )

    # Évolution
    evolution_maladie = models.CharField(max_length=20, choices=EvolutionMaladie.choices, blank=True)
    marqueurs_biologiques = models.TextField(blank=True, help_text="CEA, CA125, PSA, etc.")

    # Compte rendu
    motif           = models.TextField(blank=True)
    examen_clinique = models.TextField(blank=True)
    conclusion      = models.TextField(blank=True)
    conduite_a_tenir= models.TextField(blank=True, help_text="CAT : examens, traitements, prochaine consultation")
    prochaine_consultation = models.DateField(null=True, blank=True)

    date_creation   = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)
    cree_par        = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='consultations_creees')

    class Meta:
        db_table  = 'consultations_suivi'
        ordering  = ['-date_consultation']
        verbose_name = 'Consultation de suivi'

    def __str__(self):
        return f"[{self.patient.registration_number}] {self.get_type_consultation_display()} – {self.date_consultation}"

    def save(self, *args, **kwargs):
        if self.poids_kg and self.taille_cm and self.taille_cm > 0:
            h = self.taille_cm / 100
            self.imc = round(float(self.poids_kg) / (h * h), 1)
        super().save(*args, **kwargs)


# ─────────────────────────────────────────────────────────────────
# 2. ÉVALUATION QUALITÉ DE VIE (ECOG / EORTC QLQ-C30 simplifié)
# ─────────────────────────────────────────────────────────────────

class QualiteVie(models.Model):
    """
    Évaluation de la qualité de vie — basée sur EORTC QLQ-C30.
    Scores de 1 à 4 (1=Pas du tout, 2=Un peu, 3=Assez, 4=Beaucoup)
    """

    patient       = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='qualites_vie')
    consultation  = models.OneToOneField(ConsultationSuivi, on_delete=models.SET_NULL, null=True, blank=True, related_name='qualite_vie')
    date_evaluation = models.DateField()

    # ── Fonctionnement physique ──────────────────────────────────
    difficulte_activites_intenses = models.PositiveSmallIntegerField(null=True, blank=True, choices=[(1,'1'),(2,'2'),(3,'3'),(4,'4')])
    difficulte_longue_marche      = models.PositiveSmallIntegerField(null=True, blank=True, choices=[(1,'1'),(2,'2'),(3,'3'),(4,'4')])
    difficulte_courte_marche      = models.PositiveSmallIntegerField(null=True, blank=True, choices=[(1,'1'),(2,'2'),(3,'3'),(4,'4')])
    alite_journee                 = models.PositiveSmallIntegerField(null=True, blank=True, choices=[(1,'1'),(2,'2'),(3,'3'),(4,'4')])
    besoin_aide_repas_toilette    = models.PositiveSmallIntegerField(null=True, blank=True, choices=[(1,'1'),(2,'2'),(3,'3'),(4,'4')])

    # ── Symptômes ────────────────────────────────────────────────
    score_fatigue    = models.PositiveSmallIntegerField(null=True, blank=True, choices=[(1,'1'),(2,'2'),(3,'3'),(4,'4')])
    score_nausees    = models.PositiveSmallIntegerField(null=True, blank=True, choices=[(1,'1'),(2,'2'),(3,'3'),(4,'4')])
    score_douleur    = models.PositiveSmallIntegerField(null=True, blank=True, choices=[(1,'1'),(2,'2'),(3,'3'),(4,'4')])
    score_dyspnee    = models.PositiveSmallIntegerField(null=True, blank=True, choices=[(1,'1'),(2,'2'),(3,'3'),(4,'4')])
    score_insomnie   = models.PositiveSmallIntegerField(null=True, blank=True, choices=[(1,'1'),(2,'2'),(3,'3'),(4,'4')])
    score_appetit    = models.PositiveSmallIntegerField(null=True, blank=True, choices=[(1,'1'),(2,'2'),(3,'3'),(4,'4')])
    score_constipation = models.PositiveSmallIntegerField(null=True, blank=True, choices=[(1,'1'),(2,'2'),(3,'3'),(4,'4')])
    score_diarrhee   = models.PositiveSmallIntegerField(null=True, blank=True, choices=[(1,'1'),(2,'2'),(3,'3'),(4,'4')])

    # ── Fonctionnement émotionnel & social ───────────────────────
    score_anxiete    = models.PositiveSmallIntegerField(null=True, blank=True, choices=[(1,'1'),(2,'2'),(3,'3'),(4,'4')])
    score_depression = models.PositiveSmallIntegerField(null=True, blank=True, choices=[(1,'1'),(2,'2'),(3,'3'),(4,'4')])
    difficulte_sociale = models.PositiveSmallIntegerField(null=True, blank=True, choices=[(1,'1'),(2,'2'),(3,'3'),(4,'4')])

    # ── Score global (1-7, calculé ou saisi) ─────────────────────
    score_global_sante = models.PositiveSmallIntegerField(
        null=True, blank=True,
        help_text="Score global santé / QdV de 1 (très mauvais) à 7 (excellent)"
    )

    observations = models.TextField(blank=True)
    cree_par     = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table  = 'qualites_vie'
        ordering  = ['-date_evaluation']
        verbose_name = 'Évaluation qualité de vie'

    def __str__(self):
        return f"[{self.patient.registration_number}] QdV – {self.date_evaluation}"

    @property
    def score_fonctionnel(self):
        """Score fonctionnel moyen (plus bas = meilleur)."""
        vals = [v for v in [
            self.difficulte_activites_intenses, self.difficulte_longue_marche,
            self.difficulte_courte_marche, self.alite_journee, self.besoin_aide_repas_toilette
        ] if v is not None]
        return round(sum(vals) / len(vals), 1) if vals else None

    @property
    def score_symptomes(self):
        """Score symptômes moyen (plus bas = meilleur)."""
        vals = [v for v in [
            self.score_fatigue, self.score_nausees, self.score_douleur,
            self.score_dyspnee, self.score_insomnie, self.score_appetit,
        ] if v is not None]
        return round(sum(vals) / len(vals), 1) if vals else None


# ─────────────────────────────────────────────────────────────────
# 3. ÉVÉNEMENTS / COMPLICATIONS
# ─────────────────────────────────────────────────────────────────

class EvenementClinique(models.Model):
    """Événements cliniques importants : hospitalisations, complications, décès."""

    class TypeEvenement(models.TextChoices):
        HOSPITALISATION  = 'hospit',   'Hospitalisation'
        COMPLICATION     = 'complic',  'Complication'
        RECIDIVE         = 'recidive', 'Récidive / Rechute'
        METASTASE        = 'meta',     'Nouvelle métastase'
        TOXICITE         = 'toxicite', 'Toxicité traitement'
        DECES            = 'deces',    'Décès'
        REMISSION        = 'remission','Remission confirmée'
        AUTRE            = 'autre',    'Autre'

    class Severite(models.TextChoices):
        LEGERE   = '1', 'Grade 1 – Légère'
        MODEREE  = '2', 'Grade 2 – Modérée'
        SEVERE   = '3', 'Grade 3 – Sévère'
        CRITIQUE = '4', 'Grade 4 – Critique'
        DECES    = '5', 'Grade 5 – Décès'

    patient        = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='evenements')
    type_evenement = models.CharField(max_length=20, choices=TypeEvenement.choices)
    severite       = models.CharField(max_length=1, choices=Severite.choices, blank=True)
    date_evenement = models.DateField()
    date_resolution= models.DateField(null=True, blank=True)
    description    = models.TextField()
    traitement_consequence = models.TextField(blank=True, help_text="Impact sur le traitement en cours")
    hospitalisation_duree  = models.PositiveSmallIntegerField(null=True, blank=True, help_text="Durée en jours")
    lien_traitement        = models.CharField(max_length=200, blank=True, help_text="Traitement en cause")
    resolu         = models.BooleanField(default=False)
    observations   = models.TextField(blank=True)
    cree_par       = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='evenements_crees')
    date_creation  = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table  = 'evenements_cliniques'
        ordering  = ['-date_evenement']
        verbose_name = 'Événement clinique'

    def __str__(self):
        return f"[{self.patient.registration_number}] {self.get_type_evenement_display()} – {self.date_evenement}"
