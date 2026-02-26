import json

TOPOGRAPHIES = [
    # Sein
    {"code": "C50.0", "libelle": "Mamelon et aréole du sein", "categorie": "Sein"},
    {"code": "C50.1", "libelle": "Portion centrale du sein", "categorie": "Sein"},
    {"code": "C50.2", "libelle": "Quadrant supéro-interne du sein", "categorie": "Sein"},
    {"code": "C50.3", "libelle": "Quadrant inféro-interne du sein", "categorie": "Sein"},
    {"code": "C50.4", "libelle": "Quadrant supéro-externe du sein", "categorie": "Sein"},
    {"code": "C50.5", "libelle": "Quadrant inféro-externe du sein", "categorie": "Sein"},
    {"code": "C50.8", "libelle": "Lésion à cheval du sein", "categorie": "Sein"},
    {"code": "C50.9", "libelle": "Sein, sans précision", "categorie": "Sein"},
    # Côlon & Rectum
    {"code": "C18.0", "libelle": "Caecum", "categorie": "Côlon-Rectum"},
    {"code": "C18.2", "libelle": "Côlon ascendant", "categorie": "Côlon-Rectum"},
    {"code": "C18.3", "libelle": "Angle hépatique du côlon", "categorie": "Côlon-Rectum"},
    {"code": "C18.4", "libelle": "Côlon transverse", "categorie": "Côlon-Rectum"},
    {"code": "C18.5", "libelle": "Angle splénique du côlon", "categorie": "Côlon-Rectum"},
    {"code": "C18.6", "libelle": "Côlon descendant", "categorie": "Côlon-Rectum"},
    {"code": "C18.7", "libelle": "Côlon sigmoïde", "categorie": "Côlon-Rectum"},
    {"code": "C18.9", "libelle": "Côlon, sans précision", "categorie": "Côlon-Rectum"},
    {"code": "C19",   "libelle": "Jonction recto-sigmoïdienne", "categorie": "Côlon-Rectum"},
    {"code": "C20",   "libelle": "Rectum", "categorie": "Côlon-Rectum"},
    # Poumon
    {"code": "C34.0", "libelle": "Bronche principale", "categorie": "Poumon"},
    {"code": "C34.1", "libelle": "Lobe supérieur du poumon", "categorie": "Poumon"},
    {"code": "C34.2", "libelle": "Lobe moyen du poumon", "categorie": "Poumon"},
    {"code": "C34.3", "libelle": "Lobe inférieur du poumon", "categorie": "Poumon"},
    {"code": "C34.8", "libelle": "Lésion à cheval du poumon", "categorie": "Poumon"},
    {"code": "C34.9", "libelle": "Poumon, sans précision", "categorie": "Poumon"},
    # Col & Corps utérin
    {"code": "C53.0", "libelle": "Endocol", "categorie": "Utérus"},
    {"code": "C53.1", "libelle": "Exocol", "categorie": "Utérus"},
    {"code": "C53.9", "libelle": "Col utérin, sans précision", "categorie": "Utérus"},
    {"code": "C54.1", "libelle": "Endomètre", "categorie": "Utérus"},
    {"code": "C54.9", "libelle": "Corps utérin, sans précision", "categorie": "Utérus"},
    # Thyroïde
    {"code": "C73",   "libelle": "Glande thyroïde", "categorie": "Thyroïde"},
    # Prostate
    {"code": "C61",   "libelle": "Glande prostatique", "categorie": "Prostate"},
    # Estomac
    {"code": "C16.0", "libelle": "Cardia", "categorie": "Estomac"},
    {"code": "C16.1", "libelle": "Fundus gastrique", "categorie": "Estomac"},
    {"code": "C16.2", "libelle": "Corps de l'estomac", "categorie": "Estomac"},
    {"code": "C16.3", "libelle": "Antre pylorique", "categorie": "Estomac"},
    {"code": "C16.9", "libelle": "Estomac, sans précision", "categorie": "Estomac"},
    # Foie
    {"code": "C22.0", "libelle": "Carcinome hépatocellulaire", "categorie": "Foie"},
    {"code": "C22.1", "libelle": "Carcinome des voies biliaires intra-hépatiques", "categorie": "Foie"},
    # Ovaire
    {"code": "C56",   "libelle": "Ovaire", "categorie": "Ovaire"},
    # Leucémies & Lymphomes
    {"code": "C81.9", "libelle": "Maladie de Hodgkin, sans précision", "categorie": "Lymphome"},
    {"code": "C82.9", "libelle": "Lymphome folliculaire, sans précision", "categorie": "Lymphome"},
    {"code": "C83.3", "libelle": "Lymphome diffus à grandes cellules B", "categorie": "Lymphome"},
    {"code": "C90.0", "libelle": "Myélome multiple", "categorie": "Hématologie"},
    {"code": "C91.0", "libelle": "Leucémie lymphoïde aiguë", "categorie": "Hématologie"},
    {"code": "C92.0", "libelle": "Leucémie myéloïde aiguë", "categorie": "Hématologie"},
    # Peau
    {"code": "C43.9", "libelle": "Mélanome malin de la peau, sans précision", "categorie": "Peau"},
    {"code": "C44.9", "libelle": "Tumeur maligne de la peau, sans précision", "categorie": "Peau"},
    # Vessie
    {"code": "C67.9", "libelle": "Vessie urinaire, sans précision", "categorie": "Voies urinaires"},
    # Rein
    {"code": "C64",   "libelle": "Rein, à l'exclusion du bassinet", "categorie": "Voies urinaires"},
    # Pancréas
    {"code": "C25.0", "libelle": "Tête du pancréas", "categorie": "Pancréas"},
    {"code": "C25.9", "libelle": "Pancréas, sans précision", "categorie": "Pancréas"},
    # Cerveau
    {"code": "C71.9", "libelle": "Cerveau, sans précision", "categorie": "SNC"},
    # Os
    {"code": "C40.9", "libelle": "Os des membres, sans précision", "categorie": "Os"},
    {"code": "C41.9", "libelle": "Os, sans précision", "categorie": "Os"},
]

MORPHOLOGIES = [
    # Carcinomes
    {"code": "8000/3", "libelle": "Tumeur maligne, sans précision", "groupe": "Non spécifié", "comportement": "3"},
    {"code": "8010/2", "libelle": "Carcinome in situ, sans précision", "groupe": "Carcinome", "comportement": "2"},
    {"code": "8010/3", "libelle": "Carcinome, sans précision", "groupe": "Carcinome", "comportement": "3"},
    {"code": "8020/3", "libelle": "Carcinome indifférencié, sans précision", "groupe": "Carcinome", "comportement": "3"},
    {"code": "8070/3", "libelle": "Carcinome épidermoïde, sans précision", "groupe": "Carcinome épidermoïde", "comportement": "3"},
    {"code": "8140/3", "libelle": "Adénocarcinome, sans précision", "groupe": "Adénocarcinome", "comportement": "3"},
    {"code": "8140/2", "libelle": "Adénocarcinome in situ, sans précision", "groupe": "Adénocarcinome", "comportement": "2"},
    {"code": "8211/3", "libelle": "Adénocarcinome tubulaire", "groupe": "Adénocarcinome", "comportement": "3"},
    {"code": "8480/3", "libelle": "Adénocarcinome mucineux", "groupe": "Adénocarcinome", "comportement": "3"},
    {"code": "8490/3", "libelle": "Carcinome à cellules en bague", "groupe": "Adénocarcinome", "comportement": "3"},
    # Sein
    {"code": "8500/2", "libelle": "Carcinome canalaire in situ", "groupe": "Carcinome du sein", "comportement": "2"},
    {"code": "8500/3", "libelle": "Carcinome canalaire infiltrant, sans précision", "groupe": "Carcinome du sein", "comportement": "3"},
    {"code": "8520/3", "libelle": "Carcinome lobulaire infiltrant, sans précision", "groupe": "Carcinome du sein", "comportement": "3"},
    {"code": "8522/3", "libelle": "Carcinome canalaire et lobulaire infiltrant", "groupe": "Carcinome du sein", "comportement": "3"},
    {"code": "8200/3", "libelle": "Carcinome adénoïde kystique", "groupe": "Carcinome du sein", "comportement": "3"},
    # Poumon
    {"code": "8046/3", "libelle": "Carcinome neuroendocrine à petites cellules", "groupe": "Carcinome du poumon", "comportement": "3"},
    {"code": "8260/3", "libelle": "Adénocarcinome papillaire", "groupe": "Carcinome du poumon", "comportement": "3"},
    {"code": "8480/3", "libelle": "Adénocarcinome mucineux", "groupe": "Adénocarcinome", "comportement": "3"},
    # Thyroïde
    {"code": "8330/3", "libelle": "Adénocarcinome folliculaire, sans précision", "groupe": "Thyroïde", "comportement": "3"},
    {"code": "8340/3", "libelle": "Carcinome papillaire variante folliculaire", "groupe": "Thyroïde", "comportement": "3"},
    {"code": "8260/3", "libelle": "Carcinome papillaire", "groupe": "Thyroïde", "comportement": "3"},
    # Lymphomes
    {"code": "9650/3", "libelle": "Maladie de Hodgkin, sclérose nodulaire", "groupe": "Lymphome", "comportement": "3"},
    {"code": "9680/3", "libelle": "Lymphome diffus à grandes cellules B", "groupe": "Lymphome", "comportement": "3"},
    {"code": "9732/3", "libelle": "Myélome multiple", "groupe": "Hématologie", "comportement": "3"},
    {"code": "9811/3", "libelle": "Leucémie lymphoïde aiguë B", "groupe": "Hématologie", "comportement": "3"},
    {"code": "9861/3", "libelle": "Leucémie myéloïde aiguë, sans précision", "groupe": "Hématologie", "comportement": "3"},
    # Sarcomes
    {"code": "8800/3", "libelle": "Sarcome, sans précision", "groupe": "Sarcome", "comportement": "3"},
    {"code": "8890/3", "libelle": "Léiomyosarcome, sans précision", "groupe": "Sarcome", "comportement": "3"},
    {"code": "9180/3", "libelle": "Ostéosarcome, sans précision", "groupe": "Sarcome osseux", "comportement": "3"},
    # Mélanome
    {"code": "8720/3", "libelle": "Mélanome malin, sans précision", "groupe": "Mélanome", "comportement": "3"},
    # Prostate
    {"code": "8140/3", "libelle": "Adénocarcinome de la prostate", "groupe": "Adénocarcinome", "comportement": "3"},
]

if __name__ == '__main__':
    print(f"Topographies: {len(TOPOGRAPHIES)}")
    print(f"Morphologies: {len(MORPHOLOGIES)}")
