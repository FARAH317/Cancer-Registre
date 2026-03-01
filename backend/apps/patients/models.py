from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Patient(models.Model):
    """
    Fiche patient complète conforme CanReg5 / CIRC-OMS.
    """

    class Sexe(models.TextChoices):
        MASCULIN = 'M', 'Masculin'
        FEMININ  = 'F', 'Féminin'
        INCONNU  = 'U', 'Inconnu'

    class StatutVital(models.TextChoices):
        VIVANT    = 'vivant',  'Vivant'
        DECEDE    = 'decede',  'Décédé'
        INCONNU   = 'inconnu', 'Inconnu'
        PERDU_VUE = 'perdu',   'Perdu de vue'

    class StatutDossier(models.TextChoices):
        NOUVEAU       = 'nouveau',    'Nouveau'
        EN_TRAITEMENT = 'traitement', 'En traitement'
        REMISSION     = 'remission',  'Rémission'
        PERDU_VUE     = 'perdu',      'Perdu de vue'
        DECEDE        = 'decede',     'Décédé'
        ARCHIVE       = 'archive',    'Archivé'

    class NiveauInstruction(models.TextChoices):
        AUCUN      = '0', 'Aucun'
        PRIMAIRE   = '1', 'Primaire'
        MOYEN      = '2', 'Moyen'
        SECONDAIRE = '3', 'Secondaire'
        SUPERIEUR  = '4', 'Supérieur'
        INCONNU    = '9', 'Inconnu'

    class Profession(models.TextChoices):
        AGRICULTEUR   = 'AGR', 'Agriculteur'
        FONCTIONNAIRE = 'FON', 'Fonctionnaire'
        COMMERCANT    = 'COM', 'Commerçant'
        ARTISAN       = 'ART', 'Artisan'
        ETUDIANT      = 'ETU', 'Étudiant'
        RETRAITE      = 'RET', 'Retraité'
        SANS_EMPLOI   = 'SEM', 'Sans emploi'
        FEMME_FOYER   = 'FFO', 'Femme au foyer'
        PROF_SANTE    = 'PSA', 'Professionnel de santé'
        AUTRE         = 'AUT', 'Autre'
        INCONNU       = 'INC', 'Inconnu'

    # ── Identifiant CanReg5 ──────────────────────────────────────
    registration_number = models.CharField(max_length=20, unique=True, blank=True)
    id_national = models.CharField(max_length=20, blank=True, help_text="Numéro national d'identité")

    # ── Identité ─────────────────────────────────────────────────
    nom             = models.CharField(max_length=100)
    prenom          = models.CharField(max_length=100)
    nom_jeune_fille = models.CharField(max_length=100, blank=True)
    sexe            = models.CharField(max_length=1, choices=Sexe.choices)
    date_naissance  = models.DateField(null=True, blank=True)
    age_diagnostic  = models.PositiveSmallIntegerField(null=True, blank=True)
    lieu_naissance  = models.CharField(max_length=100, blank=True)
    nationalite     = models.CharField(max_length=50, default='Algérienne')

    # ── Coordonnées ──────────────────────────────────────────────
    adresse     = models.TextField(blank=True)
    commune     = models.CharField(max_length=100, blank=True)
    wilaya      = models.CharField(max_length=100, blank=True)
    code_postal = models.CharField(max_length=10, blank=True)
    telephone   = models.CharField(max_length=20, blank=True)
    telephone2  = models.CharField(max_length=20, blank=True)
    email       = models.EmailField(blank=True)

    # ── Profil socio-démographique ────────────────────────────────
    niveau_instruction = models.CharField(
        max_length=1, choices=NiveauInstruction.choices, default='9'
    )
    profession = models.CharField(
        max_length=3, choices=Profession.choices, default='INC'
    )
    situation_familiale = models.CharField(
        max_length=20,
        choices=[
            ('celibataire', 'Célibataire'), ('marie', 'Marié(e)'),
            ('divorce', 'Divorcé(e)'),      ('veuf', 'Veuf/Veuve'),
            ('inconnu', 'Inconnu'),
        ],
        default='inconnu'
    )
    nombre_enfants = models.PositiveSmallIntegerField(null=True, blank=True)

    # ── Antécédents ───────────────────────────────────────────────
    antecedents_personnels = models.TextField(blank=True)
    antecedents_familiaux  = models.TextField(blank=True)
    tabagisme = models.CharField(
        max_length=20,
        choices=[('non','Non-fumeur'),('ex','Ex-fumeur'),('actif','Fumeur actif'),('inconnu','Inconnu')],
        default='inconnu'
    )
    alcool = models.CharField(
        max_length=20,
        choices=[('non','Non'),('oui','Oui'),('inconnu','Inconnu')],
        default='inconnu'
    )

    # ── Statut ────────────────────────────────────────────────────
    statut_dossier = models.CharField(
        max_length=20, choices=StatutDossier.choices, default='nouveau'
    )
    statut_vital = models.CharField(
        max_length=10, choices=StatutVital.choices, default='inconnu'
    )
    date_deces  = models.DateField(null=True, blank=True)
    cause_deces = models.CharField(max_length=200, blank=True)

    # ── Médecin référent ──────────────────────────────────────────
    medecin_referent = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='patients_suivis'
    )
    etablissement_pec = models.CharField(max_length=200, blank=True)

    # ── Métadonnées ───────────────────────────────────────────────
    date_enregistrement = models.DateTimeField(auto_now_add=True)
    date_modification   = models.DateTimeField(auto_now=True)
    cree_par = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name='patients_crees'
    )
    notes    = models.TextField(blank=True)
    est_actif = models.BooleanField(default=True)

    class Meta:
        db_table = 'patients'
        ordering = ['-date_enregistrement']
        verbose_name = 'Patient'
        verbose_name_plural = 'Patients'

    def __str__(self):
        return f"{self.registration_number} – {self.nom} {self.prenom}"

    def save(self, *args, **kwargs):
        if not self.registration_number:
            self.registration_number = self._generate_reg_number()
        super().save(*args, **kwargs)

    def _generate_reg_number(self):
        from django.utils import timezone
        year = timezone.now().year
        count = Patient.objects.filter(
            registration_number__startswith=f'P-{year}-'
        ).count()
        return f'P-{year}-{count + 1:04d}'

    def get_full_name(self):
        return f"{self.nom} {self.prenom}".strip()

    @property
    def age(self):
        if self.date_naissance:
            from django.utils import timezone
            today = timezone.now().date()
            return today.year - self.date_naissance.year - (
                (today.month, today.day) <
                (self.date_naissance.month, self.date_naissance.day)
            )
        return self.age_diagnostic


class ContactUrgence(models.Model):
    patient    = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='contacts_urgence')
    nom        = models.CharField(max_length=100)
    prenom     = models.CharField(max_length=100)
    lien       = models.CharField(max_length=50)
    telephone  = models.CharField(max_length=20)
    telephone2 = models.CharField(max_length=20, blank=True)

    class Meta:
        db_table = 'contacts_urgence'
