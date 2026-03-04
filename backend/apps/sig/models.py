"""
SIG – Système d'Information Géographique Oncologique
Modèles Django pour la carte interactive d'Algérie.

Architecture :
  Wilaya          → 58 wilayas d'Algérie (données de référence)
  Commune         → Communes rattachées à chaque wilaya
  FacteurRisque   → Facteurs de risque épidémiologiques par wilaya/région
  StatCancerWilaya→ Snapshot agrégé des statistiques cancer par wilaya × période
  StatCancerCommune→ Snapshot agrégé par commune × période

Note : les données réelles sont agrégées depuis apps.patients et apps.diagnostics
via les méthodes de manager ou les vues SIG. Ces modèles servent à :
  1. Stocker la géographie de référence (wilayas, communes)
  2. Mettre en cache les statistiques pré-calculées pour performance
  3. Gérer les facteurs de risque éditables via l'admin
"""

from django.db import models
from django.utils import timezone
from django.conf import settings

# ─────────────────────────────────────────────────────────────────
# 1. WILAYA  (58 wilayas d'Algérie)
# ─────────────────────────────────────────────────────────────────

class Wilaya(models.Model):

    class Region(models.TextChoices):
        NORD            = 'nord',           'Nord (Littoral)'
        EST             = 'est',            'Est'
        OUEST           = 'ouest',          'Ouest'
        HAUTS_PLATEAUX  = 'hauts_plateaux', 'Hauts Plateaux'
        SUD             = 'sud',            'Grand Sud'

    code        = models.PositiveSmallIntegerField(
        primary_key=True,
        help_text="Numéro officiel de la wilaya (1–58)"
    )
    nom         = models.CharField(max_length=100, help_text="Nom officiel de la wilaya")
    nom_ar      = models.CharField(max_length=100, blank=True, help_text="Nom en arabe")
    region      = models.CharField(
        max_length=20,
        choices=Region.choices,
        default=Region.NORD,
        db_index=True,
    )

    # Géographie
    latitude    = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True,
        help_text="Latitude du chef-lieu"
    )
    longitude   = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True,
        help_text="Longitude du chef-lieu"
    )
    superficie_km2 = models.PositiveIntegerField(
        null=True, blank=True,
        help_text="Superficie en km²"
    )
    population  = models.PositiveIntegerField(
        null=True, blank=True,
        help_text="Population (dernier recensement)"
    )

    # Métadonnées
    chef_lieu   = models.CharField(max_length=100, blank=True)
    nb_communes = models.PositiveSmallIntegerField(default=0)
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        db_table  = 'sig_wilayas'
        ordering  = ['code']
        verbose_name = 'Wilaya'
        verbose_name_plural = 'Wilayas'

    def __str__(self):
        return f"W{self.code:02d} – {self.nom}"

    @property
    def total_patients(self):
        """Nombre total de patients enregistrés dans cette wilaya."""
        from apps.patients.models import Patient
        return Patient.objects.filter(wilaya_code=self.code).count()

    @property
    def incidence_pour_100k(self):
        """Incidence pour 100 000 habitants (si population connue)."""
        if not self.population:
            return None
        total = self.total_patients
        return round((total / self.population) * 100_000, 2)

    def get_stats_cancer(self):
        """
        Retourne un dict {type_cancer: nombre} pour cette wilaya,
        calculé en temps réel depuis les diagnostics.
        """
        from apps.diagnostics.models import Diagnostic
        from django.db.models import Count
        qs = (
            Diagnostic.objects
            .filter(patient__wilaya_code=self.code)
            .values('type_cancer')
            .annotate(n=Count('id'))
            .order_by('-n')
        )
        return {row['type_cancer']: row['n'] for row in qs}

    def get_communes_stats(self):
        """
        Retourne les statistiques par commune pour cette wilaya.
        """
        from apps.patients.models import Patient
        from django.db.models import Count
        return (
            Patient.objects
            .filter(wilaya_code=self.code)
            .values('commune')
            .annotate(total=Count('id'))
            .order_by('-total')
        )


# ─────────────────────────────────────────────────────────────────
# 2. COMMUNE
# ─────────────────────────────────────────────────────────────────

class Commune(models.Model):
    wilaya      = models.ForeignKey(
        Wilaya,
        on_delete=models.CASCADE,
        related_name='communes',
    )
    code        = models.CharField(
        max_length=10,
        help_text="Code commune (ex: 16001)"
    )
    nom         = models.CharField(max_length=150)
    nom_ar      = models.CharField(max_length=150, blank=True)
    latitude    = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude   = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    population  = models.PositiveIntegerField(null=True, blank=True)
    est_chef_lieu = models.BooleanField(
        default=False,
        help_text="Cette commune est-elle le chef-lieu de la wilaya ?"
    )

    class Meta:
        db_table        = 'sig_communes'
        ordering        = ['wilaya', 'nom']
        unique_together = [['wilaya', 'code']]
        verbose_name    = 'Commune'

    def __str__(self):
        return f"{self.nom} (W{self.wilaya_id})"

    @property
    def total_patients(self):
        from apps.patients.models import Patient
        return Patient.objects.filter(
            wilaya_code=self.wilaya_id,
            commune__iexact=self.nom
        ).count()


# ─────────────────────────────────────────────────────────────────
# 3. FACTEUR DE RISQUE  (par wilaya ou par région)
# ─────────────────────────────────────────────────────────────────

class FacteurRisque(models.Model):

    class Niveau(models.TextChoices):
        TRES_ELEVE = 'tres_eleve', 'Très élevé'
        ELEVE      = 'eleve',      'Élevé'
        MODERE     = 'modere',     'Modéré'
        FAIBLE     = 'faible',     'Faible'

    class Portee(models.TextChoices):
        WILAYA  = 'wilaya',  'Spécifique à une wilaya'
        REGION  = 'region',  'Spécifique à une région'
        NATIONAL= 'national','National'

    # Portée : wilaya spécifique OU région entière
    portee      = models.CharField(
        max_length=10,
        choices=Portee.choices,
        default=Portee.REGION,
    )
    wilaya      = models.ForeignKey(
        Wilaya,
        on_delete=models.CASCADE,
        null=True, blank=True,
        related_name='facteurs_risque',
        help_text="Laisser vide pour un facteur régional/national"
    )
    region      = models.CharField(
        max_length=20,
        choices=Wilaya.Region.choices,
        blank=True,
        help_text="Région concernée (si portée = région)"
    )

    # Facteur
    nom         = models.CharField(max_length=200, help_text="Nom du facteur de risque")
    description = models.TextField(blank=True)
    niveau      = models.CharField(
        max_length=15,
        choices=Niveau.choices,
        default=Niveau.MODERE,
    )
    icone       = models.CharField(
        max_length=10, blank=True,
        help_text="Emoji représentant le facteur (ex: 🚬)"
    )
    source      = models.CharField(
        max_length=200, blank=True,
        help_text="Source épidémiologique (INSP, OMS, INCa…)"
    )
    actif       = models.BooleanField(default=True)
    ordre       = models.PositiveSmallIntegerField(
        default=0,
        help_text="Ordre d'affichage (0 = premier)"
    )
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table  = 'sig_facteurs_risque'
        ordering  = ['ordre', 'niveau', 'nom']
        verbose_name = 'Facteur de risque'
        verbose_name_plural = 'Facteurs de risque'

    def __str__(self):
        scope = self.wilaya.nom if self.wilaya else (self.region or 'National')
        return f"[{scope}] {self.nom} ({self.get_niveau_display()})"

    def niveau_display_fr(self):
        mapping = {
            'tres_eleve': 'très élevé',
            'eleve':      'élevé',
            'modere':     'modéré',
            'faible':     'faible',
        }
        return mapping.get(self.niveau, self.niveau)


# ─────────────────────────────────────────────────────────────────
# 4. STAT CANCER WILAYA  (cache pré-calculé, mis à jour périodiquement)
# ─────────────────────────────────────────────────────────────────

class StatCancerWilaya(models.Model):
    """
    Snapshot des statistiques oncologiques par wilaya × année.
    Mis à jour via une commande de management : manage.py update_sig_stats
    Permet d'éviter des requêtes lourdes à chaque chargement de la carte.
    """
    wilaya          = models.ForeignKey(
        Wilaya,
        on_delete=models.CASCADE,
        related_name='stats_cancer',
    )
    annee           = models.PositiveSmallIntegerField(
        help_text="Année de la statistique",
        db_index=True,
    )

    # Totaux globaux
    total_patients  = models.PositiveIntegerField(default=0)
    total_hommes    = models.PositiveIntegerField(default=0)
    total_femmes    = models.PositiveIntegerField(default=0)
    total_nouveaux  = models.PositiveIntegerField(
        default=0,
        help_text="Nouveaux cas diagnostiqués cette année"
    )
    total_deces     = models.PositiveIntegerField(default=0)

    # Incidence
    incidence_pour_100k = models.DecimalField(
        max_digits=8, decimal_places=2, null=True, blank=True,
        help_text="Taux pour 100 000 habitants"
    )

    # Distribution par type de cancer (stockée en JSON)
    cancers_json    = models.JSONField(
        default=dict,
        help_text='{"Sein": 45, "Colorectal": 23, …}'
    )

    # Distribution par commune (JSON)
    communes_json   = models.JSONField(
        default=list,
        help_text='[{"nom": "Oran", "total": 45, "cancers": {…}}, …]'
    )

    # Métadonnées du snapshot
    date_calcul     = models.DateTimeField(
        default=timezone.now,
        help_text="Date/heure du dernier calcul"
    )
    est_complet     = models.BooleanField(
        default=False,
        help_text="True si le calcul a été effectué sans erreur"
    )

    class Meta:
        db_table        = 'sig_stats_wilaya'
        ordering        = ['-annee', 'wilaya']
        unique_together = [['wilaya', 'annee']]
        verbose_name    = 'Statistique wilaya'
        verbose_name_plural = 'Statistiques par wilaya'

    def __str__(self):
        return f"{self.wilaya.nom} – {self.annee} ({self.total_patients} patients)"

    @property
    def cancer_principal(self):
        """Retourne le type de cancer le plus fréquent."""
        if not self.cancers_json:
            return None
        return max(self.cancers_json, key=self.cancers_json.get)

    @property
    def top_cancers(self):
        """Retourne les 5 cancers les plus fréquents."""
        return sorted(
            self.cancers_json.items(),
            key=lambda x: x[1],
            reverse=True
        )[:5]

    @classmethod
    def calculer_et_sauvegarder(cls, wilaya_code, annee=None):
        """
        Recalcule et sauvegarde les stats pour une wilaya donnée.
        Appeler depuis la commande : manage.py update_sig_stats
        """
        from apps.patients.models import Patient
        from apps.diagnostics.models import Diagnostic
        from django.db.models import Count, Q

        if annee is None:
            annee = timezone.now().year

        try:
            wilaya = Wilaya.objects.get(code=wilaya_code)
        except Wilaya.DoesNotExist:
            return None

        # Patients filtrés par wilaya + année de diagnostic
        patients_qs = Patient.objects.filter(wilaya_code=wilaya_code)

        total   = patients_qs.count()
        hommes  = patients_qs.filter(sexe='M').count()
        femmes  = patients_qs.filter(sexe='F').count()

        # Nouveaux cas de l'année
        nouveaux = patients_qs.filter(
            date_diagnostic__year=annee
        ).count() if hasattr(Patient, 'date_diagnostic') else 0

        # Distribution par type de cancer
        cancers = {}
        diags = (
            Diagnostic.objects
            .filter(patient__wilaya_code=wilaya_code)
            .values('type_cancer')
            .annotate(n=Count('id'))
        )
        for row in diags:
            if row['type_cancer']:
                cancers[row['type_cancer']] = row['n']

        # Distribution par commune
        communes_qs = (
            patients_qs
            .values('commune')
            .annotate(total=Count('id'))
            .order_by('-total')
        )
        communes = [
            {'nom': row['commune'] or 'Inconnue', 'total': row['total']}
            for row in communes_qs
            if row['commune']
        ]

        # Incidence
        incidence = None
        if wilaya.population and wilaya.population > 0:
            incidence = round((total / wilaya.population) * 100_000, 2)

        stat, _ = cls.objects.update_or_create(
            wilaya=wilaya,
            annee=annee,
            defaults={
                'total_patients':      total,
                'total_hommes':        hommes,
                'total_femmes':        femmes,
                'total_nouveaux':      nouveaux,
                'cancers_json':        cancers,
                'communes_json':       communes,
                'incidence_pour_100k': incidence,
                'date_calcul':         timezone.now(),
                'est_complet':         True,
            }
        )
        return stat


# ─────────────────────────────────────────────────────────────────
# 5. STAT CANCER COMMUNE  (granularité commune)
# ─────────────────────────────────────────────────────────────────

class StatCancerCommune(models.Model):
    """
    Statistiques oncologiques à l'échelle de la commune.
    """
    commune         = models.ForeignKey(
        Commune,
        on_delete=models.CASCADE,
        related_name='stats_cancer',
    )
    annee           = models.PositiveSmallIntegerField(db_index=True)
    total_patients  = models.PositiveIntegerField(default=0)
    cancers_json    = models.JSONField(default=dict)
    date_calcul     = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table        = 'sig_stats_commune'
        ordering        = ['-annee', 'commune']
        unique_together = [['commune', 'annee']]
        verbose_name    = 'Statistique commune'
        verbose_name_plural = 'Statistiques par commune'

    def __str__(self):
        return f"{self.commune.nom} – {self.annee} ({self.total_patients} patients)"


# ─────────────────────────────────────────────────────────────────
# 6. ALERTE EPIDEMIOLOGIQUE  (détection de clusters)
# ─────────────────────────────────────────────────────────────────

class AlerteEpidemiologique(models.Model):

    class Niveau(models.TextChoices):
        INFO    = 'info',    'Information'
        VIGILANCE = 'vigilance', 'Vigilance'
        ALERTE  = 'alerte',  'Alerte'
        URGENCE = 'urgence', 'Urgence'

    wilaya          = models.ForeignKey(
        Wilaya,
        on_delete=models.CASCADE,
        related_name='alertes',
    )
    niveau          = models.CharField(
        max_length=10,
        choices=Niveau.choices,
        default=Niveau.INFO,
        db_index=True,
    )
    type_cancer     = models.CharField(
        max_length=100, blank=True,
        help_text="Type de cancer concerné (vide = tous types)"
    )
    titre           = models.CharField(max_length=200)
    description     = models.TextField()
    date_debut      = models.DateField()
    date_fin        = models.DateField(null=True, blank=True)
    active          = models.BooleanField(default=True, db_index=True)
    date_creation   = models.DateTimeField(auto_now_add=True)
    cree_par = models.ForeignKey(
    settings.AUTH_USER_MODEL,  # ← utilise le Custom User
    on_delete=models.SET_NULL,
    null=True,
    blank=True,
    related_name='alertes_sig_creees',
)

    class Meta:
        db_table  = 'sig_alertes'
        ordering  = ['-date_debut', 'niveau']
        verbose_name = 'Alerte épidémiologique'
        verbose_name_plural = 'Alertes épidémiologiques'

    def __str__(self):
        return f"[{self.get_niveau_display()}] {self.titre} – {self.wilaya.nom}"