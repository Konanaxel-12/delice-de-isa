"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Commande } from "../context/PanierContext";

const MOT_DE_PASSE = "DeliceIsa2026!";
const CLE_ADMIN = "delice_de_isa_admin";

const statuts: {
    valeur: Commande["statut"];
    label: string;
    emoji: string;
}[] = [
        {
            valeur: "recue",
            label: "Commande reçue",
            emoji: "🟠",
        },
        {
            valeur: "confirmee",
            label: "Confirmée",
            emoji: "🔵",
        },
        {
            valeur: "preparation",
            label: "En préparation",
            emoji: "👨‍🍳",
        },
        {
            valeur: "prete",
            label: "Prête",
            emoji: "📦",
        },
        {
            valeur: "livraison",
            label: "En livraison",
            emoji: "🚚",
        },
        {
            valeur: "livree",
            label: "Livrée",
            emoji: "🎉",
        },
        {
            valeur: "annulee",
            label: "Annulée",
            emoji: "❌",
        },
    ];

type Plat = {
    id: string;
    nom: string;
    description: string;
    prix: number;
    categorie: string;
    emoji: string;
    image?: string;
    disponible: boolean;
};

export default function AdminPage() {
    const router = useRouter();

    const [commandes, setCommandes] = useState<Commande[]>([]);
    const [connecte, setConnecte] = useState(false);
    const [motDePasse, setMotDePasse] = useState("");
    const [erreur, setErreur] = useState("");
    const [recherche, setRecherche] = useState("");

    const [nouvellesCommandes, setNouvellesCommandes] = useState(0);

    const [commandeNouvelleId, setCommandeNouvelleId] =
        useState<string | null>(null);

    const nombreCommandesPrecedent =
        useRef<number | null>(null);

    const chargementInitial = useRef(true);

    // ==========================================
    // 🍽️ GESTION DU MENU
    // ==========================================

    const [plats, setPlats] = useState<Plat[]>([]);
    const [menuOuvert, setMenuOuvert] = useState(false);

    const [platEnEdition, setPlatEnEdition] =
        useState<Plat | null>(null);

    const [formulairePlat, setFormulairePlat] = useState({
        nom: "",
        description: "",
        prix: "",
        categorie: "Poulet",
        emoji: "🍽️",
        image: "",
        disponible: true,
    });

    const [chargementPlats, setChargementPlats] =
        useState(false);

    const [erreurPlats, setErreurPlats] = useState("");

    // ==========================================
    // 🔔 SONNERIE
    // ==========================================

    const audioAlerteRef =
        useRef<HTMLAudioElement | null>(null);

    const jouerAlerte = () => {
        try {
            const audio = audioAlerteRef.current;

            if (!audio) {
                console.warn(
                    "🔇 La sonnerie n'est pas encore activée."
                );
                return;
            }

            audio.pause();
            audio.currentTime = 0;
            audio.volume = 1;

            const lecture = audio.play();

            lecture.catch((erreurAudio) => {
                console.error(
                    "🔇 Le navigateur a bloqué la sonnerie :",
                    erreurAudio
                );
            });
        } catch (erreurAudio) {
            console.error(
                "Erreur lors de la lecture de la sonnerie :",
                erreurAudio
            );
        }
    };

    // ==========================================
    // 🔐 VERIFICATION CONNEXION
    // ==========================================

    useEffect(() => {
        const adminConnecte =
            localStorage.getItem(CLE_ADMIN);

        if (adminConnecte === "true") {
            setConnecte(true);
        }
    }, []);

    // ==========================================
    // 📥 CHARGER LES COMMANDES DEPUIS FIREBASE
    // ==========================================

    const chargerCommandes = async (
        afficherErreur = true
    ) => {
        try {
            const reponse = await fetch(
                "/api/commandes",
                {
                    method: "GET",
                    cache: "no-store",
                }
            );

            const resultat = await reponse.json();

            if (!reponse.ok) {
                throw new Error(
                    resultat.erreur ||
                    "Impossible de récupérer les commandes."
                );
            }

            const commandesRecues = Array.isArray(
                resultat.commandes
            )
                ? (resultat.commandes as Commande[])
                : [];

            setCommandes(commandesRecues);

            if (chargementInitial.current) {
                nombreCommandesPrecedent.current =
                    commandesRecues.length;

                chargementInitial.current = false;

                return;
            }

            const ancienNombre =
                nombreCommandesPrecedent.current ?? 0;

            const nouveauNombre =
                commandesRecues.length;

            if (nouveauNombre > ancienNombre) {
                const difference =
                    nouveauNombre - ancienNombre;

                setNouvellesCommandes(
                    (ancienNombreNouvelles) =>
                        ancienNombreNouvelles +
                        difference
                );

                const derniereCommande =
                    commandesRecues[0];

                if (derniereCommande) {
                    setCommandeNouvelleId(
                        derniereCommande.id
                    );

                    jouerAlerte();
                }
            }

            nombreCommandesPrecedent.current =
                nouveauNombre;
        } catch (erreurAPI) {
            console.error(
                "Erreur récupération commandes :",
                erreurAPI
            );

            if (afficherErreur) {
                setErreur(
                    "Impossible de récupérer les commandes."
                );
            }
        }
    };

    // ==========================================
    // 🔄 CHARGEMENT AUTOMATIQUE DES COMMANDES
    // ==========================================

    useEffect(() => {
        if (!connecte) {
            return;
        }

        chargerCommandes();

        const intervalle = setInterval(() => {
            chargerCommandes(false);
        }, 5000);

        return () => {
            clearInterval(intervalle);
        };
    }, [connecte]);

    // ==========================================
    // 🔐 CONNEXION
    // ==========================================

    const seConnecter = () => {
        if (motDePasse !== MOT_DE_PASSE) {
            setErreur("Mot de passe incorrect.");
            return;
        }

        localStorage.setItem(
            CLE_ADMIN,
            "true"
        );

        setConnecte(true);
        setErreur("");
        setMotDePasse("");

        try {
            const audio = new Audio(
                "/sounds/nouvelle-commande.mp3"
            );

            audio.preload = "auto";
            audio.volume = 0;

            audioAlerteRef.current = audio;

            const activation = audio.play();

            activation
                .then(() => {
                    audio.pause();
                    audio.currentTime = 0;
                    audio.volume = 1;

                    console.log(
                        "🔔 SONNERIE ACTIVÉE"
                    );
                })
                .catch((erreurAudio) => {
                    console.error(
                        "Impossible d'activer la sonnerie :",
                        erreurAudio
                    );

                    audio.volume = 1;
                });
        } catch (erreurAudio) {
            console.error(
                "Erreur d'initialisation de la sonnerie :",
                erreurAudio
            );
        }
    };

    // ==========================================
    // 🚪 DECONNEXION
    // ==========================================

    const seDeconnecter = () => {
        localStorage.removeItem(CLE_ADMIN);

        setConnecte(false);

        if (audioAlerteRef.current) {
            audioAlerteRef.current.pause();
            audioAlerteRef.current.currentTime = 0;
        }

        audioAlerteRef.current = null;
    };

    // ==========================================
    // ⚙️ MODIFIER LE STATUT D'UNE COMMANDE
    // ==========================================

    const modifierStatutCommande = async (
        id: string,
        statut: Commande["statut"]
    ) => {
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

            const resultat = await reponse.json();

            if (!reponse.ok) {
                throw new Error(
                    resultat.erreur ||
                    "Impossible de modifier le statut."
                );
            }

            setCommandes(
                (anciennesCommandes) =>
                    anciennesCommandes.map(
                        (commande) =>
                            commande.id === id
                                ? {
                                    ...commande,
                                    statut,
                                }
                                : commande
                    )
            );
        } catch (erreurStatut) {
            console.error(
                "Erreur modification statut :",
                erreurStatut
            );

            alert(
                "Impossible de modifier le statut de cette commande."
            );
        }
    };

    // ==========================================
    // 🍽️ CHARGER LES PLATS
    // ==========================================

    const chargerPlats = async () => {
        try {
            setChargementPlats(true);
            setErreurPlats("");

            const reponse = await fetch(
                "/api/plats",
                {
                    method: "GET",
                    cache: "no-store",
                }
            );

            const resultat = await reponse.json();

            if (!reponse.ok) {
                throw new Error(
                    resultat.error ||
                    "Impossible de récupérer les plats."
                );
            }

            setPlats(
                Array.isArray(resultat)
                    ? resultat
                    : []
            );
        } catch (erreur) {
            console.error(
                "Erreur récupération plats :",
                erreur
            );

            setErreurPlats(
                "Impossible de récupérer les plats."
            );
        } finally {
            setChargementPlats(false);
        }
    };

    // ==========================================
    // ➕ AJOUTER UN PLAT
    // ==========================================

    const ajouterPlat = async () => {
        try {
            if (
                !formulairePlat.nom.trim() ||
                !formulairePlat.description.trim() ||
                !formulairePlat.prix
            ) {
                alert(
                    "Veuillez remplir le nom, la description et le prix."
                );
                return;
            }

            const reponse = await fetch(
                "/api/plats",
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                    body: JSON.stringify({
                        ...formulairePlat,
                        prix: Number(
                            formulairePlat.prix
                        ),
                    }),
                }
            );

            const resultat = await reponse.json();

            if (!reponse.ok) {
                throw new Error(
                    resultat.error ||
                    "Impossible d'ajouter le plat."
                );
            }

            setPlats((anciensPlats) => [
                ...anciensPlats,
                resultat,
            ]);

            reinitialiserFormulaire();
        } catch (erreur) {
            console.error(
                "Erreur ajout plat :",
                erreur
            );

            alert(
                "Impossible d'ajouter le plat."
            );
        }
    };

    // ==========================================
    // ✏️ MODIFIER UN PLAT
    // ==========================================

    const modifierPlat = async () => {
        if (!platEnEdition) {
            return;
        }

        try {
            const reponse = await fetch(
                `/api/plats/${platEnEdition.id}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                    body: JSON.stringify({
                        ...formulairePlat,
                        prix: Number(
                            formulairePlat.prix
                        ),
                    }),
                }
            );

            const resultat = await reponse.json();

            if (!reponse.ok) {
                throw new Error(
                    resultat.error ||
                    "Impossible de modifier le plat."
                );
            }

            setPlats((anciensPlats) =>
                anciensPlats.map((plat) =>
                    plat.id === resultat.id
                        ? resultat
                        : plat
                )
            );

            reinitialiserFormulaire();
        } catch (erreur) {
            console.error(
                "Erreur modification plat :",
                erreur
            );

            alert(
                "Impossible de modifier le plat."
            );
        }
    };

    // ==========================================
    // 🗑️ SUPPRIMER UN PLAT
    // ==========================================

    const supprimerPlat = async (
        id: string
    ) => {
        const confirmer = window.confirm(
            "Voulez-vous vraiment supprimer ce plat ?"
        );

        if (!confirmer) {
            return;
        }

        try {
            const reponse = await fetch(
                `/api/plats/${id}`,
                {
                    method: "DELETE",
                }
            );

            const resultat = await reponse.json();

            if (!reponse.ok) {
                throw new Error(
                    resultat.error ||
                    "Impossible de supprimer le plat."
                );
            }

            setPlats((anciensPlats) =>
                anciensPlats.filter(
                    (plat) => plat.id !== id
                )
            );
        } catch (erreur) {
            console.error(
                "Erreur suppression plat :",
                erreur
            );

            alert(
                "Impossible de supprimer le plat."
            );
        }
    };

    // ==========================================
    // ✏️ PRÉPARER LA MODIFICATION
    // ==========================================

    const commencerModification = (
        plat: Plat
    ) => {
        setPlatEnEdition(plat);

        setFormulairePlat({
            nom: plat.nom,
            description: plat.description,
            prix: String(plat.prix),
            categorie: plat.categorie,
            emoji: plat.emoji,
            image: plat.image || "",
            disponible: plat.disponible,
        });

        // 📍 Aller directement au formulaire
        setTimeout(() => {
            document
                .getElementById("formulaire-plat")
                ?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                });
        }, 100);
    };

    // ==========================================
    // 🔄 RÉINITIALISER LE FORMULAIRE
    // ==========================================

    const reinitialiserFormulaire = () => {
        setPlatEnEdition(null);

        setFormulairePlat({
            nom: "",
            description: "",
            prix: "",
            categorie: "Poulet",
            emoji: "🍽️",
            image: "",
            disponible: true,
        });
    };

    // ==========================================
    // 🍽️ OUVRIR LE MENU
    // ==========================================

    const ouvrirGestionMenu = () => {
        setMenuOuvert(true);

        setTimeout(() => {
            document
                .getElementById("gestion-menu")
                ?.scrollIntoView({
                    behavior: "smooth",
                });
        }, 100);
    };

    useEffect(() => {
        if (menuOuvert) {
            chargerPlats();
        }
    }, [menuOuvert]);

    // ==========================================
    // 🔎 RECHERCHE COMMANDES
    // ==========================================

    const commandesFiltrees = commandes
        .filter((commande) => {
            const texte = recherche
                .toLowerCase()
                .trim();

            if (!texte) {
                return true;
            }

            return (
                commande.id
                    .toLowerCase()
                    .includes(texte) ||
                commande.nom
                    .toLowerCase()
                    .includes(texte) ||
                commande.telephone
                    .toLowerCase()
                    .includes(texte)
            );
        })
        .sort(
            (a, b) =>
                new Date(b.date).getTime() -
                new Date(a.date).getTime()
        );

    // ==========================================
    // 📊 STATISTIQUES
    // ==========================================

    const nombreCommandes = commandes.length;

    const nombreNouvelles = commandes.filter(
        (commande) =>
            commande.statut === "recue"
    ).length;

    const nombrePreparation = commandes.filter(
        (commande) =>
            commande.statut === "preparation"
    ).length;

    const chiffreAffaires = commandes
        .filter(
            (commande) =>
                commande.statut !== "annulee"
        )
        .reduce(
            (total, commande) =>
                total + commande.total,
            0
        );

    // ==========================================
    // 💰 FORMATAGE PRIX
    // ==========================================

    const formaterPrix = (montant: number) => {
        return `${montant.toLocaleString(
            "fr-FR"
        )} FCFA`;
    };

    // ==========================================
    // 📅 FORMATAGE DATE
    // ==========================================

    const formaterDate = (date: string) => {
        return new Date(date).toLocaleString(
            "fr-FR",
            {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            }
        );
    };

    // ==========================================
    // 🔐 PAGE DE CONNEXION
    // ==========================================

    if (!connecte) {
        return (
            <main className="min-h-screen bg-[#FBF3EA] flex items-center justify-center px-4">
                <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8">
                    <div className="text-center mb-8">
                        <div className="text-6xl mb-4">
                            👨‍🍳
                        </div>

                        <h1 className="text-3xl font-bold text-[#2B2019]">
                            ESPACE RESTAURANT
                        </h1>

                        <p className="text-[#D9631B] font-bold mt-2">
                            DÉLICE DE ISA
                        </p>

                        <p className="text-gray-500 mt-2">
                            Connexion administrateur
                        </p>
                    </div>

                    <input
                        type="password"
                        value={motDePasse}
                        onChange={(e) =>
                            setMotDePasse(
                                e.target.value
                            )
                        }
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                seConnecter();
                            }
                        }}
                        placeholder="Mot de passe"
                        className="w-full border border-gray-200 rounded-xl px-4 py-4 outline-none focus:ring-2 focus:ring-[#D9631B] mb-3"
                    />

                    {erreur && (
                        <p className="text-red-500 text-sm mb-4">
                            ❌ {erreur}
                        </p>
                    )}

                    <button
                        onClick={seConnecter}
                        className="w-full bg-[#D9631B] text-white font-bold py-4 rounded-xl hover:opacity-90 transition"
                    >
                        🔐 Se connecter
                    </button>

                    <button
                        onClick={() =>
                            router.push("/")
                        }
                        className="w-full mt-3 bg-[#2F5233] text-white font-bold py-4 rounded-xl hover:opacity-90 transition"
                    >
                        🍽️ Retour au menu
                    </button>
                </div>
            </main>
        );
    }

    // ==========================================
    // 📊 TABLEAU DE BORD
    // ==========================================

    return (
        <main className="min-h-screen bg-[#FBF3EA]">
            <header className="bg-[#2F5233] text-white">
                <div className="max-w-7xl mx-auto px-4 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <p className="text-sm opacity-80">
                            👨‍🍳 ESPACE RESTAURANT
                        </p>

                        <h1 className="text-2xl md:text-3xl font-bold">
                            DÉLICE DE ISA
                        </h1>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                        <button
                            onClick={() =>
                                router.push("/")
                            }
                            className="bg-white text-[#2F5233] px-4 py-2 rounded-xl font-bold"
                        >
                            🍽️ Voir le menu
                        </button>

                        <button
                            onClick={ouvrirGestionMenu}
                            className="bg-[#D9631B] text-white px-4 py-2 rounded-xl font-bold"
                        >
                            🛠️ Gestion du menu
                        </button>

                        <button
                            onClick={seDeconnecter}
                            className="bg-red-500 text-white px-4 py-2 rounded-xl font-bold"
                        >
                            🚪 Déconnexion
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 py-8">
                {nouvellesCommandes > 0 && (
                    <div className="mb-6 bg-orange-100 border-2 border-[#D9631B] rounded-2xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-bold text-[#D9631B]">
                                🔔 Nouvelle commande !
                            </h2>

                            <p className="text-[#2B2019] mt-1">
                                {nouvellesCommandes ===
                                    1
                                    ? "Une nouvelle commande vient d'arriver."
                                    : `${nouvellesCommandes} nouvelles commandes viennent d'arriver.`}
                            </p>
                        </div>

                        <button
                            onClick={() => {
                                setNouvellesCommandes(
                                    0
                                );
                                setCommandeNouvelleId(
                                    null
                                );
                            }}
                            className="bg-[#D9631B] text-white px-5 py-3 rounded-xl font-bold"
                        >
                            ✓ J'ai vu
                        </button>
                    </div>
                )}

                <div className="mb-6">
                    <h2 className="text-3xl font-bold text-[#2B2019]">
                        Tableau de bord 📊
                    </h2>

                    <p className="text-gray-600 mt-1">
                        Gérez les commandes et le menu de
                        DÉLICE DE ISA
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white rounded-2xl p-5 shadow-sm">
                        <p className="text-gray-500 text-sm">
                            📦 Commandes
                        </p>

                        <p className="text-3xl font-bold text-[#2B2019] mt-2">
                            {nombreCommandes}
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl p-5 shadow-sm">
                        <p className="text-gray-500 text-sm">
                            🟠 Nouvelles
                        </p>

                        <p className="text-3xl font-bold text-[#D9631B] mt-2">
                            {nombreNouvelles}
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl p-5 shadow-sm">
                        <p className="text-gray-500 text-sm">
                            👨‍🍳 En préparation
                        </p>

                        <p className="text-3xl font-bold text-[#2F5233] mt-2">
                            {nombrePreparation}
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl p-5 shadow-sm">
                        <p className="text-gray-500 text-sm">
                            💰 Chiffre commandes
                        </p>

                        <p className="text-2xl font-bold text-[#2B2019] mt-2">
                            {formaterPrix(
                                chiffreAffaires
                            )}
                        </p>
                    </div>
                </div>

                {/* ======================================
                    🍽️ GESTION DU MENU
                ====================================== */}

                {menuOuvert && (
                    <section
                        id="gestion-menu"
                        className="mb-10"
                    >
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
                            <div>
                                <h2 className="text-3xl font-bold text-[#2B2019]">
                                    🍽️ Gestion du menu
                                </h2>

                                <p className="text-gray-500 mt-1">
                                    Ajoutez, modifiez ou
                                    supprimez les plats de
                                    DÉLICE DE ISA.
                                </p>
                            </div>

                            <button
                                onClick={() => {
                                    reinitialiserFormulaire();
                                }}
                                className="bg-[#2F5233] text-white px-5 py-3 rounded-xl font-bold"
                            >
                                ➕ Nouveau plat
                            </button>
                        </div>

                        {/* FORMULAIRE */}

                        <div
                            id="formulaire-plat"
                            className="bg-white rounded-2xl shadow-sm p-6 mb-6 scroll-mt-24"
                        >
                            <h3 className="text-xl font-bold text-[#2B2019] mb-5">
                                {platEnEdition
                                    ? "✏️ Modifier le plat"
                                    : "➕ Ajouter un plat"}
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block font-semibold text-[#2B2019] mb-2">
                                        Nom du plat
                                    </label>

                                    <input
                                        type="text"
                                        value={
                                            formulairePlat.nom
                                        }
                                        onChange={(e) =>
                                            setFormulairePlat(
                                                {
                                                    ...formulairePlat,
                                                    nom: e
                                                        .target
                                                        .value,
                                                }
                                            )
                                        }
                                        placeholder="Ex : Poulet braisé"
                                        className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#D9631B]"
                                    />
                                </div>

                                <div>
                                    <label className="block font-semibold text-[#2B2019] mb-2">
                                        Prix
                                    </label>

                                    <input
                                        type="number"
                                        min="0"
                                        value={
                                            formulairePlat.prix
                                        }
                                        onChange={(e) =>
                                            setFormulairePlat(
                                                {
                                                    ...formulairePlat,
                                                    prix: e
                                                        .target
                                                        .value,
                                                }
                                            )
                                        }
                                        placeholder="3500"
                                        className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#D9631B]"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block font-semibold text-[#2B2019] mb-2">
                                        Description
                                    </label>

                                    <textarea
                                        value={
                                            formulairePlat.description
                                        }
                                        onChange={(e) =>
                                            setFormulairePlat(
                                                {
                                                    ...formulairePlat,
                                                    description:
                                                        e
                                                            .target
                                                            .value,
                                                }
                                            )
                                        }
                                        placeholder="Décrivez votre plat..."
                                        rows={3}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#D9631B] resize-none"
                                    />
                                </div>

                                <div>
                                    <label className="block font-semibold text-[#2B2019] mb-2">
                                        Catégorie
                                    </label>

                                    <select
                                        value={
                                            formulairePlat.categorie
                                        }
                                        onChange={(e) =>
                                            setFormulairePlat(
                                                {
                                                    ...formulairePlat,
                                                    categorie:
                                                        e
                                                            .target
                                                            .value,
                                                }
                                            )
                                        }
                                        className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#D9631B] bg-white"
                                    >
                                        <option value="Plats">
                                            🍽️ Plats
                                        </option>

                                        <option value="Poulet">
                                            🍗 Poulet
                                        </option>

                                        <option value="Poisson">
                                            🐟 Poisson
                                        </option>

                                        <option value="Accompagnements">
                                            🍚 Accompagnements
                                        </option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block font-semibold text-[#2B2019] mb-2">
                                        Emoji
                                    </label>

                                    <input
                                        type="text"
                                        value={
                                            formulairePlat.emoji
                                        }
                                        onChange={(e) =>
                                            setFormulairePlat(
                                                {
                                                    ...formulairePlat,
                                                    emoji: e
                                                        .target
                                                        .value,
                                                }
                                            )
                                        }
                                        placeholder="🍗"
                                        className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#D9631B]"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block font-semibold text-[#2B2019] mb-2">
                                        Image du plat
                                        <span className="text-gray-400 font-normal ml-2">
                                            (optionnel)
                                        </span>
                                    </label>

                                    <input
                                        type="text"
                                        value={
                                            formulairePlat.image
                                        }
                                        onChange={(e) =>
                                            setFormulairePlat(
                                                {
                                                    ...formulairePlat,
                                                    image: e
                                                        .target
                                                        .value,
                                                }
                                            )
                                        }
                                        placeholder="URL de l'image"
                                        className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#D9631B]"
                                    />
                                </div>
                            </div>

                            <label className="flex items-center gap-3 mt-5 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={
                                        formulairePlat.disponible
                                    }
                                    onChange={(e) =>
                                        setFormulairePlat(
                                            {
                                                ...formulairePlat,
                                                disponible:
                                                    e
                                                        .target
                                                        .checked,
                                            }
                                        )
                                    }
                                    className="w-5 h-5"
                                />

                                <span className="font-semibold text-[#2B2019]">
                                    🟢 Plat disponible à la
                                    commande
                                </span>
                            </label>

                            <div className="flex flex-wrap gap-3 mt-6">
                                <button
                                    onClick={
                                        platEnEdition
                                            ? modifierPlat
                                            : ajouterPlat
                                    }
                                    className="bg-[#D9631B] text-white px-6 py-3 rounded-xl font-bold"
                                >
                                    {platEnEdition
                                        ? "💾 Enregistrer les modifications"
                                        : "➕ Ajouter le plat"}
                                </button>

                                {platEnEdition && (
                                    <button
                                        onClick={
                                            reinitialiserFormulaire
                                        }
                                        className="bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-bold"
                                    >
                                        ✖️ Annuler
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* LISTE DES PLATS */}

                        <div className="bg-white rounded-2xl shadow-sm p-6">
                            <div className="flex items-center justify-between mb-5">
                                <div>
                                    <h3 className="text-xl font-bold text-[#2B2019]">
                                        📋 Plats du menu
                                    </h3>

                                    <p className="text-gray-500 text-sm mt-1">
                                        {plats.length} plat
                                        {plats.length > 1
                                            ? "s"
                                            : ""}
                                    </p>
                                </div>

                                <button
                                    onClick={chargerPlats}
                                    className="bg-gray-100 px-4 py-2 rounded-xl font-semibold"
                                >
                                    🔄 Actualiser
                                </button>
                            </div>

                            {chargementPlats ? (
                                <div className="text-center py-10">
                                    <div className="text-5xl mb-3">
                                        🍽️
                                    </div>

                                    <p className="text-gray-500">
                                        Chargement du menu...
                                    </p>
                                </div>
                            ) : erreurPlats ? (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-red-600">
                                    ❌ {erreurPlats}
                                </div>
                            ) : plats.length === 0 ? (
                                <div className="text-center py-10">
                                    <div className="text-5xl mb-3">
                                        🍽️
                                    </div>

                                    <h4 className="text-lg font-bold text-[#2B2019]">
                                        Aucun plat pour le moment
                                    </h4>

                                    <p className="text-gray-500 mt-1">
                                        Ajoutez votre premier plat
                                        avec le formulaire ci-dessus.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {plats.map((plat) => (
                                        <div
                                            key={plat.id}
                                            className={`border-2 rounded-2xl p-5 transition ${plat.disponible
                                                    ? "border-gray-100"
                                                    : "border-red-200 bg-red-50"
                                                }`}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="text-5xl">
                                                    {plat.emoji ||
                                                        "🍽️"}
                                                </div>

                                                <span
                                                    className={`px-3 py-1 rounded-full text-xs font-bold ${plat.disponible
                                                            ? "bg-green-100 text-green-700"
                                                            : "bg-red-100 text-red-700"
                                                        }`}
                                                >
                                                    {plat.disponible
                                                        ? "🟢 Disponible"
                                                        : "🔴 Indisponible"}
                                                </span>
                                            </div>

                                            <h4 className="text-xl font-bold text-[#2B2019] mt-4">
                                                {plat.nom}
                                            </h4>

                                            <p className="text-gray-500 text-sm mt-2 min-h-[40px]">
                                                {plat.description}
                                            </p>

                                            <div className="flex items-center justify-between mt-4">
                                                <span className="text-xl font-bold text-[#D9631B]">
                                                    {formaterPrix(
                                                        plat.prix
                                                    )}
                                                </span>

                                                <span className="text-xs bg-gray-100 px-3 py-1 rounded-full">
                                                    {plat.categorie}
                                                </span>
                                            </div>

                                            <div className="flex gap-2 mt-5">
                                                <button
                                                    onClick={() =>
                                                        commencerModification(
                                                            plat
                                                        )
                                                    }
                                                    className="flex-1 bg-[#2F5233] text-white py-2.5 rounded-xl font-bold"
                                                >
                                                    ✏️ Modifier
                                                </button>

                                                <button
                                                    onClick={() =>
                                                        supprimerPlat(
                                                            plat.id
                                                        )
                                                    }
                                                    className="bg-red-100 text-red-600 px-4 py-2.5 rounded-xl font-bold"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {/* ======================================
                    🔎 RECHERCHE COMMANDES
                ====================================== */}

                <div className="bg-white rounded-2xl p-5 shadow-sm mb-6">
                    <label className="block font-bold text-[#2B2019] mb-2">
                        🔎 Rechercher une commande
                    </label>

                    <input
                        type="text"
                        value={recherche}
                        onChange={(e) =>
                            setRecherche(
                                e.target.value
                            )
                        }
                        placeholder="Numéro, nom ou téléphone..."
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#D9631B]"
                    />
                </div>

                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-[#2B2019]">
                            Commandes 📥
                        </h2>

                        <p className="text-gray-500">
                            {commandesFiltrees.length}{" "}
                            commande
                            {commandesFiltrees.length >
                                1
                                ? "s"
                                : ""}
                        </p>
                    </div>
                </div>

                {commandesFiltrees.length ===
                    0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
                        <div className="text-6xl mb-4">
                            📭
                        </div>

                        <h3 className="text-xl font-bold text-[#2B2019]">
                            Aucune commande
                        </h3>

                        <p className="text-gray-500 mt-2">
                            Les nouvelles commandes
                            apparaîtront ici
                            automatiquement.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-5">
                        {commandesFiltrees.map(
                            (commande) => {
                                const estNouvelle =
                                    commande.id ===
                                    commandeNouvelleId;

                                const statutActuel =
                                    statuts.find(
                                        (statut) =>
                                            statut.valeur ===
                                            commande.statut
                                    );

                                const numeroWhatsApp =
                                    commande.telephone.replace(
                                        /\D/g,
                                        ""
                                    );

                                return (
                                    <div
                                        key={
                                            commande.id
                                        }
                                        className={`bg-white rounded-2xl shadow-sm p-5 border-2 transition ${estNouvelle
                                                ? "border-[#D9631B] ring-4 ring-orange-100"
                                                : "border-transparent"
                                            }`}
                                    >
                                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                            <div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h3 className="text-xl font-bold text-[#2B2019]">
                                                        #
                                                        {
                                                            commande.id
                                                        }
                                                    </h3>

                                                    {estNouvelle && (
                                                        <span className="bg-[#D9631B] text-white px-3 py-1 rounded-full text-xs font-bold">
                                                            🆕 NOUVELLE
                                                        </span>
                                                    )}
                                                </div>

                                                <p className="text-gray-500 text-sm mt-1">
                                                    📅{" "}
                                                    {formaterDate(
                                                        commande.date
                                                    )}
                                                </p>
                                            </div>

                                            <div className="bg-gray-100 rounded-xl px-4 py-2 font-bold">
                                                {
                                                    statutActuel?.emoji
                                                }{" "}
                                                {
                                                    statutActuel?.label
                                                }
                                            </div>
                                        </div>

                                        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="bg-[#FBF3EA] rounded-xl p-4">
                                                <p className="text-sm text-gray-500">
                                                    👤 Client
                                                </p>

                                                <p className="font-bold text-lg text-[#2B2019]">
                                                    {
                                                        commande.nom
                                                    }
                                                </p>

                                                <a
                                                    href={`tel:${commande.telephone}`}
                                                    className="text-[#D9631B] font-semibold"
                                                >
                                                    📞{" "}
                                                    {
                                                        commande.telephone
                                                    }
                                                </a>

                                                <a
                                                    href={`https://wa.me/${numeroWhatsApp}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="block text-green-600 font-semibold mt-1"
                                                >
                                                    💬 WhatsApp
                                                </a>
                                            </div>

                                            <div className="bg-[#FBF3EA] rounded-xl p-4">
                                                <p className="text-sm text-gray-500">
                                                    🚚 Livraison
                                                </p>

                                                <p className="font-bold text-[#2B2019]">
                                                    {commande.modeLivraison ===
                                                        "livraison"
                                                        ? "🚚 Livraison"
                                                        : "🍽️ Retrait sur place"}
                                                </p>

                                                {commande.adresse && (
                                                    <p className="text-gray-600 mt-1">
                                                        📍{" "}
                                                        {
                                                            commande.adresse
                                                        }
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="mt-5">
                                            <h4 className="font-bold text-[#2B2019] mb-3">
                                                🛒 Articles commandés
                                            </h4>

                                            <div className="space-y-2">
                                                {commande.articles.map(
                                                    (
                                                        article
                                                    ) => (
                                                        <div
                                                            key={
                                                                article.id
                                                            }
                                                            className="flex justify-between items-center bg-gray-50 rounded-xl px-4 py-3"
                                                        >
                                                            <div>
                                                                <span className="font-semibold">
                                                                    {
                                                                        article.nom
                                                                    }
                                                                </span>

                                                                <span className="text-gray-500 ml-2">
                                                                    ×{" "}
                                                                    {
                                                                        article.quantite
                                                                    }
                                                                </span>
                                                            </div>

                                                            <span className="font-bold">
                                                                {formaterPrix(
                                                                    article.prix *
                                                                    article.quantite
                                                                )}
                                                            </span>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        </div>

                                        {commande.instructions && (
                                            <div className="mt-5 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                                                <p className="font-bold text-[#2B2019]">
                                                    📝 Instructions
                                                </p>

                                                <p className="text-gray-700 mt-1">
                                                    {
                                                        commande.instructions
                                                    }
                                                </p>
                                            </div>
                                        )}

                                        <div className="mt-5 flex items-center justify-between border-t pt-5">
                                            <span className="font-bold text-lg">
                                                Total
                                            </span>

                                            <span className="text-2xl font-bold text-[#D9631B]">
                                                {formaterPrix(
                                                    commande.total
                                                )}
                                            </span>
                                        </div>

                                        <div className="mt-5">
                                            <p className="font-bold text-[#2B2019] mb-3">
                                                ⚙️ Modifier le statut
                                            </p>

                                            <div className="flex flex-wrap gap-2">
                                                {statuts.map(
                                                    (
                                                        statut
                                                    ) => (
                                                        <button
                                                            key={
                                                                statut.valeur
                                                            }
                                                            onClick={() =>
                                                                modifierStatutCommande(
                                                                    commande.id,
                                                                    statut.valeur
                                                                )
                                                            }
                                                            className={`px-3 py-2 rounded-xl text-sm font-semibold transition ${commande.statut ===
                                                                    statut.valeur
                                                                    ? "bg-[#2F5233] text-white"
                                                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                                                }`}
                                                        >
                                                            {
                                                                statut.emoji
                                                            }{" "}
                                                            {
                                                                statut.label
                                                            }
                                                        </button>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            }
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}