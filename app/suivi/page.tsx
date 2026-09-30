"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type ArticlePanier = {
    id: number;
    nom: string;
    prix: number;
    quantite: number;
    emoji?: string;
};

type CommandeSuivi = {
    id: string;
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

const etapes = [
    {
        statut: "recue",
        titre: "Commande reçue",
        emoji: "🟠",
        description: "Votre commande a bien été reçue.",
    },
    {
        statut: "confirmee",
        titre: "Commande confirmée",
        emoji: "🔵",
        description: "Le restaurant a confirmé votre commande.",
    },
    {
        statut: "preparation",
        titre: "En préparation",
        emoji: "👨‍🍳",
        description: "Votre commande est en cours de préparation.",
    },
    {
        statut: "prete",
        titre: "Commande prête",
        emoji: "📦",
        description: "Votre commande est prête.",
    },
    {
        statut: "livraison",
        titre: "En livraison",
        emoji: "🚚",
        description: "Votre commande est en route.",
    },
    {
        statut: "livree",
        titre: "Livrée",
        emoji: "🎉",
        description: "Votre commande a été livrée.",
    },
];

function SuiviContenu() {
    const searchParams = useSearchParams();

    const token = searchParams.get("token");

    const [commande, setCommande] =
        useState<CommandeSuivi | null>(null);

    const [chargement, setChargement] = useState(true);
    const [erreur, setErreur] = useState("");

    async function chargerCommande() {
        if (!token) {
            setErreur("Lien de suivi invalide.");
            setChargement(false);
            return;
        }

        try {
            const reponse = await fetch(
                `/api/suivi?token=${encodeURIComponent(token)}`,
                {
                    cache: "no-store",
                }
            );

            const donnees = await reponse.json();

            if (!reponse.ok) {
                throw new Error(
                    donnees.erreur ||
                    "Impossible de récupérer la commande."
                );
            }

            setCommande(donnees.commande);
            setErreur("");
        } catch (erreur) {
            console.error(
                "Erreur récupération suivi :",
                erreur
            );

            setErreur(
                erreur instanceof Error
                    ? erreur.message
                    : "Impossible de récupérer la commande."
            );
        } finally {
            setChargement(false);
        }
    }

    useEffect(() => {
        chargerCommande();

        if (!token) {
            return;
        }

        const intervalle = setInterval(() => {
            chargerCommande();
        }, 5000);

        return () => clearInterval(intervalle);
    }, [token]);

    function formaterPrix(prix: number) {
        return `${prix.toLocaleString("fr-FR")} FCFA`;
    }

    function formaterDate(date: string) {
        return new Date(date).toLocaleString("fr-FR", {
            dateStyle: "medium",
            timeStyle: "short",
        });
    }

    function obtenirEtapeActuelle() {
        if (!commande) {
            return 0;
        }

        const index = etapes.findIndex(
            (etape) => etape.statut === commande.statut
        );

        return index >= 0 ? index : 0;
    }

    const etapeActuelle = obtenirEtapeActuelle();

    if (chargement) {
        return (
            <main className="min-h-screen bg-[#FBF3EA] flex items-center justify-center p-6">
                <div className="text-center">
                    <div className="text-5xl mb-4 animate-pulse">
                        🍽️
                    </div>

                    <h1 className="text-2xl font-bold text-[#2F5233]">
                        DÉLICE DE ISA
                    </h1>

                    <p className="text-[#2B2019] mt-2">
                        Chargement du suivi de votre commande...
                    </p>
                </div>
            </main>
        );
    }

    if (erreur || !commande) {
        return (
            <main className="min-h-screen bg-[#FBF3EA] flex items-center justify-center p-6">
                <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 text-center">
                    <div className="text-6xl mb-5">
                        😕
                    </div>

                    <h1 className="text-2xl font-bold text-[#2B2019]">
                        Suivi indisponible
                    </h1>

                    <p className="text-gray-600 mt-3">
                        {erreur ||
                            "Impossible de retrouver cette commande."}
                    </p>

                    <a
                        href="/"
                        className="inline-block mt-6 px-6 py-3 rounded-xl bg-[#2F5233] text-white font-semibold hover:opacity-90 transition"
                    >
                        🍽️ Retour au menu
                    </a>
                </div>
            </main>
        );
    }

    const commandeAnnulee =
        commande.statut === "annulee";

    return (
        <main className="min-h-screen bg-[#FBF3EA] px-4 py-8">
            <div className="max-w-4xl mx-auto">

                {/* HEADER */}
                <div className="text-center mb-8">
                    <div className="text-5xl mb-3">
                        🍽️
                    </div>

                    <h1 className="text-3xl md:text-4xl font-extrabold text-[#2F5233]">
                        DÉLICE DE ISA
                    </h1>

                    <p className="text-[#2B2019] mt-2">
                        Suivi de votre commande
                    </p>

                    <div className="inline-block mt-4 bg-white px-5 py-3 rounded-2xl shadow-sm">
                        <p className="text-sm text-gray-500">
                            Numéro de commande
                        </p>

                        <p className="font-bold text-lg text-[#D9631B]">
                            #{commande.id}
                        </p>
                    </div>
                </div>

                {/* STATUT */}
                <section className="bg-white rounded-3xl shadow-lg p-5 md:p-8 mb-6">
                    {commandeAnnulee ? (
                        <div className="text-center py-6">
                            <div className="text-6xl mb-4">
                                ❌
                            </div>

                            <h2 className="text-2xl font-bold text-red-600">
                                Commande annulée
                            </h2>

                            <p className="text-gray-600 mt-2">
                                Cette commande a été annulée par le
                                restaurant.
                            </p>
                        </div>
                    ) : (
                        <>
                            <h2 className="text-xl font-bold text-[#2B2019] mb-8 text-center">
                                📍 État de votre commande
                            </h2>

                            <div className="space-y-5">
                                {etapes.map(
                                    (etape, index) => {
                                        const terminee =
                                            index <=
                                            etapeActuelle;

                                        const actuelle =
                                            index ===
                                            etapeActuelle;

                                        return (
                                            <div
                                                key={
                                                    etape.statut
                                                }
                                                className="flex items-start gap-4"
                                            >
                                                <div
                                                    className={`w-12 h-12 rounded-full flex items-center justify-center text-xl shrink-0 ${terminee
                                                            ? "bg-[#2F5233] text-white"
                                                            : "bg-gray-100 text-gray-400"
                                                        } ${actuelle
                                                            ? "ring-4 ring-[#D9631B]/20"
                                                            : ""
                                                        }`}
                                                >
                                                    {etape.emoji}
                                                </div>

                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between gap-3">
                                                        <h3
                                                            className={`font-bold ${terminee
                                                                    ? "text-[#2B2019]"
                                                                    : "text-gray-400"
                                                                }`}
                                                        >
                                                            {
                                                                etape.titre
                                                            }
                                                        </h3>

                                                        {actuelle && (
                                                            <span className="text-xs font-bold bg-[#D9631B] text-white px-3 py-1 rounded-full">
                                                                EN COURS
                                                            </span>
                                                        )}
                                                    </div>

                                                    <p
                                                        className={`text-sm mt-1 ${terminee
                                                                ? "text-gray-600"
                                                                : "text-gray-400"
                                                            }`}
                                                    >
                                                        {
                                                            etape.description
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    }
                                )}
                            </div>
                        </>
                    )}
                </section>

                {/* INFORMATIONS */}
                <div className="grid md:grid-cols-2 gap-6">

                    {/* CLIENT */}
                    <section className="bg-white rounded-3xl shadow-lg p-6">
                        <h2 className="text-xl font-bold text-[#2B2019] mb-5">
                            👤 Informations
                        </h2>

                        <div className="space-y-3 text-sm">
                            <div>
                                <p className="text-gray-500">
                                    Nom
                                </p>

                                <p className="font-semibold text-[#2B2019]">
                                    {commande.nom}
                                </p>
                            </div>

                            <div>
                                <p className="text-gray-500">
                                    Téléphone
                                </p>

                                <p className="font-semibold text-[#2B2019]">
                                    {commande.telephone}
                                </p>
                            </div>

                            <div>
                                <p className="text-gray-500">
                                    Date
                                </p>

                                <p className="font-semibold text-[#2B2019]">
                                    {formaterDate(
                                        commande.date
                                    )}
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* RECEPTION */}
                    <section className="bg-white rounded-3xl shadow-lg p-6">
                        <h2 className="text-xl font-bold text-[#2B2019] mb-5">
                            📍 Réception
                        </h2>

                        <div className="space-y-3 text-sm">
                            <div>
                                <p className="text-gray-500">
                                    Mode
                                </p>

                                <p className="font-semibold text-[#2B2019]">
                                    {commande.modeLivraison ===
                                        "livraison"
                                        ? "🚚 Livraison"
                                        : "🏪 Retrait sur place"}
                                </p>
                            </div>

                            {commande.adresse && (
                                <div>
                                    <p className="text-gray-500">
                                        Adresse
                                    </p>

                                    <p className="font-semibold text-[#2B2019]">
                                        {commande.adresse}
                                    </p>
                                </div>
                            )}

                            {commande.instructions && (
                                <div>
                                    <p className="text-gray-500">
                                        Instructions
                                    </p>

                                    <p className="font-semibold text-[#2B2019]">
                                        {commande.instructions}
                                    </p>
                                </div>
                            )}
                        </div>
                    </section>
                </div>

                {/* COMMANDE */}
                <section className="bg-white rounded-3xl shadow-lg p-6 md:p-8 mt-6">
                    <h2 className="text-xl font-bold text-[#2B2019] mb-6">
                        🛒 Votre commande
                    </h2>

                    <div className="space-y-4">
                        {commande.articles.map(
                            (article, index) => (
                                <div
                                    key={`${article.id}-${index}`}
                                    className="flex items-center justify-between gap-4 border-b border-gray-100 pb-4"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="text-2xl">
                                            {article.emoji ||
                                                "🍽️"}
                                        </div>

                                        <div>
                                            <p className="font-semibold text-[#2B2019]">
                                                {article.nom}
                                            </p>

                                            <p className="text-sm text-gray-500">
                                                {article.quantite} ×{" "}
                                                {formaterPrix(
                                                    article.prix
                                                )}
                                            </p>
                                        </div>
                                    </div>

                                    <p className="font-bold text-[#2F5233]">
                                        {formaterPrix(
                                            article.prix *
                                            article.quantite
                                        )}
                                    </p>
                                </div>
                            )
                        )}
                    </div>

                    <div className="flex items-center justify-between mt-6 pt-5 border-t-2 border-[#2F5233]">
                        <span className="text-lg font-bold text-[#2B2019]">
                            Total
                        </span>

                        <span className="text-2xl font-extrabold text-[#D9631B]">
                            {formaterPrix(
                                commande.total
                            )}
                        </span>
                    </div>
                </section>

                {/* RAFRAICHISSEMENT */}
                {!commandeAnnulee &&
                    commande.statut !== "livree" && (
                        <div className="text-center mt-6">
                            <p className="text-sm text-gray-500">
                                🔄 Le statut se met automatiquement
                                à jour.
                            </p>
                        </div>
                    )}

                {/* BOUTON */}
                <div className="text-center mt-8">
                    <a
                        href="/"
                        className="inline-block px-8 py-4 rounded-2xl bg-[#2F5233] text-white font-bold hover:opacity-90 transition shadow-lg"
                    >
                        🍽️ Retour au menu
                    </a>
                </div>
            </div>
        </main>
    );
}

export default function SuiviPage() {
    return (
        <Suspense
            fallback={
                <main className="min-h-screen bg-[#FBF3EA] flex items-center justify-center p-6">
                    <div className="text-center">
                        <div className="text-5xl mb-4 animate-pulse">
                            🍽️
                        </div>

                        <h1 className="text-2xl font-bold text-[#2F5233]">
                            DÉLICE DE ISA
                        </h1>

                        <p className="text-[#2B2019] mt-2">
                            Chargement...
                        </p>
                    </div>
                </main>
            }
        >
            <SuiviContenu />
        </Suspense>
    );
}