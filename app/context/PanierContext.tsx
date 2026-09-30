"use client";

import {
    createContext,
    useContext,
    useEffect,
    useState,
    ReactNode,
} from "react";

export type ArticlePanier = {
    id: string;
    nom: string;
    prix: number;
    quantite: number;
};

export type Commande = {
    id: string;
    trackingToken?: string;
    date: string;
    articles: ArticlePanier[];
    total: number;
    nom: string;
    telephone: string;
    modeLivraison: "livraison" | "retrait";
    adresse: string;
    instructions: string;
    statut:
    | "recue"
    | "confirmee"
    | "preparation"
    | "prete"
    | "livraison"
    | "livree"
    | "annulee";
};

type ResultatCommande = {
    id: string;
    trackingToken: string;
};

type PanierContextType = {
    panier: ArticlePanier[];

    ajouterAuPanier: (article: ArticlePanier) => void;

    diminuerQuantite: (id: string) => void;

    supprimerDuPanier: (id: string) => void;

    viderPanier: () => void;

    totalPanier: number;

    nombreArticles: number;

    commandes: Commande[];

    enregistrerCommande: (
        commande: Omit<Commande, "id" | "date" | "statut">
    ) => Promise<ResultatCommande>;

    modifierStatutCommande: (
        id: string,
        statut: Commande["statut"]
    ) => Promise<void>;
};

const PanierContext =
    createContext<PanierContextType | undefined>(
        undefined
    );

const CLE_PANIER = "delice_de_isa_panier";

export function PanierProvider({
    children,
}: {
    children: ReactNode;
}) {
    const [panier, setPanier] =
        useState<ArticlePanier[]>([]);

    const [commandes, setCommandes] =
        useState<Commande[]>([]);

    const [donneesChargees, setDonneesChargees] =
        useState(false);

    // ==========================================
    // CHARGER LE PANIER LOCAL
    // ==========================================

    useEffect(() => {
        try {
            const panierSauvegarde =
                localStorage.getItem(CLE_PANIER);

            if (panierSauvegarde) {
                const panierParse =
                    JSON.parse(panierSauvegarde);

                if (Array.isArray(panierParse)) {
                    const panierNormalise: ArticlePanier[] =
                        panierParse.map((article) => ({
                            id: String(article.id),
                            nom: String(article.nom),
                            prix: Number(article.prix),
                            quantite: Number(article.quantite),
                        }));

                    setPanier(panierNormalise);
                }
            }
        } catch (erreur) {
            console.error(
                "Erreur de chargement du panier :",
                erreur
            );
        } finally {
            setDonneesChargees(true);
        }
    }, []);

    // ==========================================
    // SAUVEGARDER LE PANIER
    // ==========================================

    useEffect(() => {
        if (!donneesChargees) {
            return;
        }

        try {
            localStorage.setItem(
                CLE_PANIER,
                JSON.stringify(panier)
            );
        } catch (erreur) {
            console.error(
                "Erreur de sauvegarde du panier :",
                erreur
            );
        }
    }, [panier, donneesChargees]);

    // ==========================================
    // AJOUTER AU PANIER
    // ==========================================

    const ajouterAuPanier = (
        article: ArticlePanier
    ) => {
        const articleNormalise: ArticlePanier = {
            id: String(article.id),
            nom: String(article.nom),
            prix: Number(article.prix),
            quantite: Number(article.quantite),
        };

        setPanier((ancienPanier) => {
            const existe = ancienPanier.find(
                (item) =>
                    item.id === articleNormalise.id
            );

            if (existe) {
                return ancienPanier.map((item) =>
                    item.id === articleNormalise.id
                        ? {
                            ...item,
                            quantite:
                                item.quantite + 1,
                        }
                        : item
                );
            }

            return [
                ...ancienPanier,
                articleNormalise,
            ];
        });
    };

    // ==========================================
    // DIMINUER QUANTITÉ
    // ==========================================

    const diminuerQuantite = (id: string) => {
        setPanier((ancienPanier) =>
            ancienPanier
                .map((item) =>
                    item.id === id
                        ? {
                            ...item,
                            quantite:
                                item.quantite - 1,
                        }
                        : item
                )
                .filter(
                    (item) => item.quantite > 0
                )
        );
    };

    // ==========================================
    // SUPPRIMER DU PANIER
    // ==========================================

    const supprimerDuPanier = (id: string) => {
        setPanier((ancienPanier) =>
            ancienPanier.filter(
                (item) => item.id !== id
            )
        );
    };

    // ==========================================
    // VIDER LE PANIER
    // ==========================================

    const viderPanier = () => {
        setPanier([]);
    };

    // ==========================================
    // TOTAL PANIER
    // ==========================================

    const totalPanier = panier.reduce(
        (total, item) =>
            total +
            Number(item.prix) *
            Number(item.quantite),
        0
    );

    // ==========================================
    // NOMBRE ARTICLES
    // ==========================================

    const nombreArticles = panier.reduce(
        (total, item) =>
            total + Number(item.quantite),
        0
    );

    // ==========================================
    // ENREGISTRER UNE COMMANDE
    // ==========================================

    const enregistrerCommande = async (
        donneesCommande: Omit<
            Commande,
            "id" | "date" | "statut"
        >
    ): Promise<ResultatCommande> => {
        try {
            const reponse = await fetch(
                "/api/commandes",
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                    body: JSON.stringify(
                        donneesCommande
                    ),
                }
            );

            const resultat =
                await reponse.json();

            if (!reponse.ok) {
                throw new Error(
                    resultat.erreur ||
                    "Impossible d'enregistrer la commande."
                );
            }

            const nouvelleCommande =
                resultat.commande as Commande;

            setCommandes((anciennes) => [
                nouvelleCommande,
                ...anciennes,
            ]);

            if (
                !nouvelleCommande.trackingToken
            ) {
                throw new Error(
                    "Le token de suivi n'a pas été généré."
                );
            }

            return {
                id: nouvelleCommande.id,
                trackingToken:
                    nouvelleCommande.trackingToken,
            };
        } catch (erreur) {
            console.error(
                "Erreur lors de l'enregistrement de la commande :",
                erreur
            );

            throw erreur;
        }
    };

    // ==========================================
    // MODIFIER LE STATUT
    // ==========================================

    const modifierStatutCommande = async (
        id: string,
        statut: Commande["statut"]
    ): Promise<void> => {
        try {
            const reponse = await fetch(
                `/api/commandes/${id}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                    body: JSON.stringify({
                        statut,
                    }),
                }
            );

            const resultat =
                await reponse.json();

            if (!reponse.ok) {
                throw new Error(
                    resultat.erreur ||
                    "Impossible de modifier le statut."
                );
            }

            setCommandes((anciennes) =>
                anciennes.map((commande) =>
                    commande.id === id
                        ? {
                            ...commande,
                            statut,
                        }
                        : commande
                )
            );
        } catch (erreur) {
            console.error(
                "Erreur lors de la modification du statut :",
                erreur
            );

            throw erreur;
        }
    };

    return (
        <PanierContext.Provider
            value={{
                panier,
                ajouterAuPanier,
                diminuerQuantite,
                supprimerDuPanier,
                viderPanier,
                totalPanier,
                nombreArticles,
                commandes,
                enregistrerCommande,
                modifierStatutCommande,
            }}
        >
            {children}
        </PanierContext.Provider>
    );
}

export function usePanier() {
    const context = useContext(
        PanierContext
    );

    if (!context) {
        throw new Error(
            "usePanier doit être utilisé à l'intérieur de PanierProvider"
        );
    }

    return context;
}