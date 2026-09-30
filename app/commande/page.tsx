"use client";

import { useEffect, useState } from "react";
import { usePanier } from "../context/PanierContext";
import { useRouter } from "next/navigation";

export default function CommandePage() {
    const router = useRouter();

    const {
        panier,
        totalPanier,
        ajouterAuPanier,
        diminuerQuantite,
        supprimerDuPanier,
        viderPanier,
        enregistrerCommande,
    } = usePanier();

    const [nom, setNom] = useState("");
    const [telephone, setTelephone] = useState("");
    const [modeLivraison, setModeLivraison] = useState<
        "livraison" | "retrait"
    >("livraison");
    const [adresse, setAdresse] = useState("");
    const [instructions, setInstructions] = useState("");

    const [commandeValidee, setCommandeValidee] = useState(false);
    const [numeroCommande, setNumeroCommande] = useState("");
    const [trackingToken, setTrackingToken] = useState("");
    const [totalCommande, setTotalCommande] = useState(0);
    const [envoiEnCours, setEnvoiEnCours] = useState(false);

    // 🚀 Redirection automatique vers le suivi
    useEffect(() => {
        if (!commandeValidee || !trackingToken) return;

        const timer = setTimeout(() => {
            router.push(
                `/suivi?token=${encodeURIComponent(trackingToken)}`
            );
        }, 2000);

        return () => clearTimeout(timer);
    }, [commandeValidee, trackingToken, router]);

    const formatPrix = (prix: number) =>
        new Intl.NumberFormat("fr-FR").format(prix) + " FCFA";

    const confirmerCommande = async () => {
        if (envoiEnCours) return;

        if (!nom.trim() || !telephone.trim()) {
            alert(
                "Veuillez renseigner votre nom et votre numéro de téléphone."
            );
            return;
        }

        if (modeLivraison === "livraison" && !adresse.trim()) {
            alert("Veuillez renseigner votre adresse de livraison.");
            return;
        }

        if (panier.length === 0) {
            alert("Votre panier est vide.");
            return;
        }

        try {
            setEnvoiEnCours(true);

            // 💰 Sauvegarder le montant avant de vider le panier
            const montantFinal = totalPanier;

            // 📝 Enregistrer la commande
            const resultatCommande = await enregistrerCommande({
                articles: [...panier],
                total: montantFinal,
                nom: nom.trim(),
                telephone: telephone.trim(),
                modeLivraison,
                adresse: adresse.trim(),
                instructions: instructions.trim(),
            });

            // 📦 Récupérer l'ID et le token de suivi
            setNumeroCommande(resultatCommande.id);
            setTrackingToken(resultatCommande.trackingToken);
            setTotalCommande(montantFinal);

            // ⭐ Mémoriser la dernière commande
            localStorage.setItem(
                "delice_de_isa_derniere_commande",
                resultatCommande.id
            );

            // 🔐 Mémoriser le token de suivi
            localStorage.setItem(
                "delice_de_isa_tracking_token",
                resultatCommande.trackingToken
            );

            // 🧹 Vider le panier
            viderPanier();

            // 🎉 Afficher la confirmation
            setCommandeValidee(true);
        } catch (erreur) {
            console.error(
                "Erreur lors de la confirmation de la commande :",
                erreur
            );

            alert(
                "Impossible d'enregistrer votre commande pour le moment. Veuillez réessayer."
            );
        } finally {
            setEnvoiEnCours(false);
        }
    };

    // 🎉 PAGE DE CONFIRMATION
    if (commandeValidee) {
        return (
            <main className="min-h-screen bg-[#FBF3EA] px-5 py-10 text-[#2B2019]">
                <div className="mx-auto max-w-2xl text-center">
                    <div className="rounded-3xl bg-white p-8 shadow-sm">
                        <div className="text-7xl">
                            🎉
                        </div>

                        <h1 className="mt-5 text-4xl font-black text-[#2F5233]">
                            Commande confirmée !
                        </h1>

                        <p className="mt-4 text-lg text-gray-600">
                            Merci <strong>{nom}</strong> pour votre commande chez{" "}
                            <strong>DÉLICE DE ISA</strong> ❤️
                        </p>

                        {/* NUMÉRO DE COMMANDE */}
                        <div className="mt-6 rounded-2xl bg-[#FFF4EC] p-5">
                            <p className="text-sm font-bold text-gray-500">
                                Votre numéro de commande
                            </p>

                            <p className="mt-2 text-3xl font-black text-[#D9631B]">
                                #{numeroCommande}
                            </p>

                            <p className="mt-2 text-sm text-gray-500">
                                Votre commande est maintenant enregistrée.
                            </p>
                        </div>

                        {/* MONTANT */}
                        <div className="mt-4 rounded-2xl bg-[#FBF3EA] p-5">
                            <p className="text-sm text-gray-500">
                                Montant de votre commande
                            </p>

                            <p className="mt-2 text-3xl font-black text-[#D9631B]">
                                {formatPrix(totalCommande)}
                            </p>
                        </div>

                        {/* MODE DE RÉCEPTION */}
                        <div className="mt-4 rounded-2xl bg-[#F1F7F2] p-5">
                            <p className="font-bold text-[#2F5233]">
                                {modeLivraison === "livraison"
                                    ? "🚚 Livraison"
                                    : "🍽️ Retrait sur place"}
                            </p>

                            {modeLivraison === "livraison" && adresse && (
                                <p className="mt-2 text-sm text-gray-600">
                                    📍 {adresse}
                                </p>
                            )}
                        </div>

                        {/* TÉLÉPHONE */}
                        <p className="mt-5 text-gray-600">
                            📞 Nous vous contacterons au{" "}
                            <strong>{telephone}</strong>.
                        </p>

                        {/* MESSAGE REDIRECTION */}
                        <div className="mt-6 rounded-2xl bg-[#F1F7F2] p-4">
                            <p className="font-bold text-[#2F5233]">
                                📍 Ouverture du suivi de votre commande...
                            </p>

                            <p className="mt-1 text-sm text-gray-500">
                                Vous allez être redirigé automatiquement.
                            </p>
                        </div>

                        {/* SUIVI MANUEL */}
                        <button
                            onClick={() =>
                                router.push(
                                    `/suivi?token=${encodeURIComponent(
                                        trackingToken
                                    )}`
                                )
                            }
                            className="mt-6 w-full rounded-full bg-[#2F5233] px-6 py-4 text-lg font-black text-white transition hover:bg-[#234027]"
                        >
                            📍 Suivre ma commande maintenant
                        </button>

                        {/* RETOUR MENU */}
                        <button
                            onClick={() => router.push("/")}
                            className="mt-3 w-full rounded-full border-2 border-[#D9631B] px-6 py-4 text-lg font-bold text-[#D9631B] transition hover:bg-[#FFF4EC]"
                        >
                            ← Retour au menu
                        </button>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#FBF3EA] px-5 py-10 text-[#2B2019]">
            <div className="mx-auto max-w-3xl">

                {/* EN-TÊTE */}
                <div className="mb-8">
                    <button
                        onClick={() => router.push("/")}
                        className="mb-5 text-sm font-bold text-[#D9631B]"
                    >
                        ← Retour au menu
                    </button>

                    <h1 className="text-4xl font-black text-[#D9631B]">
                        DÉLICE DE ISA 🍽️
                    </h1>

                    <p className="mt-2 text-gray-600">
                        Finalisez votre commande en quelques secondes.
                    </p>
                </div>

                {/* PANIER */}
                <section className="rounded-3xl bg-white p-6 shadow-sm">
                    <h2 className="text-2xl font-black">
                        Votre commande 🛒
                    </h2>

                    {panier.length === 0 ? (
                        <div className="py-10 text-center">
                            <div className="text-5xl">
                                🛒
                            </div>

                            <p className="mt-4 text-gray-500">
                                Votre panier est vide.
                            </p>

                            <button
                                onClick={() => router.push("/")}
                                className="mt-5 rounded-full bg-[#D9631B] px-6 py-3 font-bold text-white"
                            >
                                Voir le menu
                            </button>
                        </div>
                    ) : (
                        <div className="mt-6 space-y-5">
                            {panier.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex flex-col gap-4 rounded-2xl bg-[#FBF3EA] p-4 sm:flex-row sm:items-center sm:justify-between"
                                >
                                    <div>
                                        <p className="text-lg font-black">
                                            {item.nom}
                                        </p>

                                        <p className="text-sm text-gray-500">
                                            {formatPrix(item.prix)} / unité
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() =>
                                                    diminuerQuantite(item.id)
                                                }
                                                className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg font-black shadow-sm"
                                            >
                                                −
                                            </button>

                                            <span className="w-8 text-center font-black">
                                                {item.quantite}
                                            </span>

                                            <button
                                                onClick={() =>
                                                    ajouterAuPanier({
                                                        id: item.id,
                                                        nom: item.nom,
                                                        prix: item.prix,
                                                        quantite: 1,
                                                    })
                                                }
                                                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2F5233] text-lg font-black text-white"
                                            >
                                                +
                                            </button>
                                        </div>

                                        <p className="font-black text-[#D9631B]">
                                            {formatPrix(
                                                item.prix * item.quantite
                                            )}
                                        </p>

                                        <button
                                            onClick={() =>
                                                supprimerDuPanier(item.id)
                                            }
                                            className="text-xl"
                                            title="Supprimer"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            ))}

                            <div className="flex items-center justify-between border-t border-[#EAE0D5] pt-5">
                                <span className="text-xl font-black">
                                    Total
                                </span>

                                <span className="text-3xl font-black text-[#D9631B]">
                                    {formatPrix(totalPanier)}
                                </span>
                            </div>
                        </div>
                    )}
                </section>

                {panier.length > 0 && (
                    <>
                        {/* INFORMATIONS CLIENT */}
                        <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
                            <h2 className="text-2xl font-black">
                                Vos informations 👤
                            </h2>

                            <div className="mt-5 space-y-4">
                                <div>
                                    <label className="mb-2 block font-bold">
                                        Votre nom
                                    </label>

                                    <input
                                        type="text"
                                        value={nom}
                                        onChange={(e) =>
                                            setNom(e.target.value)
                                        }
                                        placeholder="Ex : Jean Kouassi"
                                        className="w-full rounded-xl border border-[#EAE0D5] px-4 py-3 outline-none focus:border-[#D9631B]"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block font-bold">
                                        Numéro de téléphone 📞
                                    </label>

                                    <input
                                        type="tel"
                                        value={telephone}
                                        onChange={(e) =>
                                            setTelephone(e.target.value)
                                        }
                                        placeholder="Ex : 07 00 00 00 00"
                                        className="w-full rounded-xl border border-[#EAE0D5] px-4 py-3 outline-none focus:border-[#D9631B]"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* MODE DE RÉCEPTION */}
                        <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
                            <h2 className="text-2xl font-black">
                                Comment souhaitez-vous recevoir votre commande ? 📦
                            </h2>

                            <div className="mt-5 grid gap-4 sm:grid-cols-2">
                                <button
                                    onClick={() =>
                                        setModeLivraison("livraison")
                                    }
                                    className={`rounded-2xl border-2 p-5 text-left transition ${modeLivraison === "livraison"
                                            ? "border-[#D9631B] bg-[#FFF4EC]"
                                            : "border-[#EAE0D5] bg-white"
                                        }`}
                                >
                                    <div className="text-3xl">
                                        🚚
                                    </div>

                                    <p className="mt-2 font-black">
                                        Livraison
                                    </p>

                                    <p className="mt-1 text-sm text-gray-500">
                                        Faites-vous livrer votre commande.
                                    </p>
                                </button>

                                <button
                                    onClick={() =>
                                        setModeLivraison("retrait")
                                    }
                                    className={`rounded-2xl border-2 p-5 text-left transition ${modeLivraison === "retrait"
                                            ? "border-[#2F5233] bg-[#F1F7F2]"
                                            : "border-[#EAE0D5] bg-white"
                                        }`}
                                >
                                    <div className="text-3xl">
                                        🍽️
                                    </div>

                                    <p className="mt-2 font-black">
                                        Retrait sur place
                                    </p>

                                    <p className="mt-1 text-sm text-gray-500">
                                        Venez récupérer votre commande.
                                    </p>
                                </button>
                            </div>

                            {modeLivraison === "livraison" && (
                                <div className="mt-5">
                                    <label className="mb-2 block font-bold">
                                        Adresse de livraison 📍
                                    </label>

                                    <textarea
                                        value={adresse}
                                        onChange={(e) =>
                                            setAdresse(e.target.value)
                                        }
                                        placeholder="Quartier, rue, repère..."
                                        rows={3}
                                        className="w-full rounded-xl border border-[#EAE0D5] px-4 py-3 outline-none focus:border-[#D9631B]"
                                    />
                                </div>
                            )}
                        </section>

                        {/* INSTRUCTIONS */}
                        <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
                            <h2 className="text-2xl font-black">
                                Instructions particulières 📝
                            </h2>

                            <textarea
                                value={instructions}
                                onChange={(e) =>
                                    setInstructions(e.target.value)
                                }
                                placeholder="Ex : moins épicé, appeler à l'arrivée..."
                                rows={4}
                                className="mt-5 w-full rounded-xl border border-[#EAE0D5] px-4 py-3 outline-none focus:border-[#D9631B]"
                            />
                        </section>

                        {/* RÉCAPITULATIF */}
                        <section className="mt-6 rounded-3xl bg-[#2F5233] p-6 text-white shadow-sm">
                            <h2 className="text-2xl font-black">
                                Récapitulatif 📋
                            </h2>

                            <div className="mt-5 space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span>Articles</span>

                                    <span>
                                        {panier.reduce(
                                            (total, item) =>
                                                total + item.quantite,
                                            0
                                        )}
                                    </span>
                                </div>

                                <div className="flex justify-between">
                                    <span>
                                        Réception
                                    </span>

                                    <span>
                                        {modeLivraison === "livraison"
                                            ? "🚚 Livraison"
                                            : "🍽️ Retrait sur place"}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-5 flex items-center justify-between border-t border-white/20 pt-5">
                                <span className="text-xl font-bold">
                                    Total
                                </span>

                                <span className="text-3xl font-black">
                                    {formatPrix(totalPanier)}
                                </span>
                            </div>
                        </section>

                        {/* CONFIRMATION */}
                        <button
                            onClick={confirmerCommande}
                            disabled={envoiEnCours}
                            className={`mt-6 w-full rounded-full px-6 py-5 text-lg font-black text-white shadow-lg transition ${envoiEnCours
                                    ? "cursor-not-allowed bg-gray-400"
                                    : "bg-[#D9631B] hover:bg-[#B84F12]"
                                }`}
                        >
                            {envoiEnCours
                                ? "⏳ Enregistrement en cours..."
                                : "Confirmer ma commande ✅"}
                        </button>

                        <p className="mt-4 text-center text-sm text-gray-500">
                            🔒 Vos informations sont utilisées uniquement pour
                            traiter votre commande.
                        </p>
                    </>
                )}
            </div>
        </main>
    );
}