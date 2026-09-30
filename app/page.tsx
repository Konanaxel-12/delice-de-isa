"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePanier } from "./context/PanierContext";

const categories = [
  "Tous",
  "Plats",
  "Poulet",
  "Poisson",
  "Accompagnements",
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

export default function Home() {
  const router = useRouter();

  const [categorie, setCategorie] = useState("Tous");
  const [derniereCommande, setDerniereCommande] = useState("");

  // 🍽️ PLATS VENANT DE FIREBASE
  const [plats, setPlats] = useState<Plat[]>([]);
  const [chargementPlats, setChargementPlats] = useState(true);
  const [erreurPlats, setErreurPlats] = useState("");

  const {
    panier,
    ajouterAuPanier,
    totalPanier,
    nombreArticles,
    commandes,
  } = usePanier();

  // 🍽️ RÉCUPÉRER LES PLATS DEPUIS FIREBASE
  useEffect(() => {
    const chargerPlats = async () => {
      try {
        setChargementPlats(true);
        setErreurPlats("");

        const response = await fetch("/api/plats");

        if (!response.ok) {
          throw new Error("Impossible de récupérer les plats.");
        }

        const data = await response.json();

        setPlats(data);
      } catch (error) {
        console.error("Erreur récupération plats :", error);
        setErreurPlats(
          "Impossible de charger le menu pour le moment."
        );
      } finally {
        setChargementPlats(false);
      }
    };

    chargerPlats();
  }, []);

  // 📍 Récupérer la dernière commande enregistrée sur cet appareil
  useEffect(() => {
    const numero = localStorage.getItem(
      "delice_de_isa_derniere_commande"
    );

    if (numero) {
      setDerniereCommande(numero);
    }
  }, []);

  // 🔄 Vérifier en temps réel si la commande est toujours active
  useEffect(() => {
    if (!derniereCommande || commandes.length === 0) return;

    const commande = commandes.find(
      (item) => item.id === derniereCommande
    );

    if (!commande) return;

    // Si la commande est terminée ou annulée,
    // on retire le bouton "Ma commande en cours".
    if (
      commande.statut === "livree" ||
      commande.statut === "annulee"
    ) {
      localStorage.removeItem(
        "delice_de_isa_derniere_commande"
      );

      setDerniereCommande("");
    }
  }, [commandes, derniereCommande]);

  // 🔎 FILTRER LES PLATS DISPONIBLES
  const platsDisponibles = plats.filter(
    (plat) => plat.disponible !== false
  );

  const platsFiltres =
    categorie === "Tous"
      ? platsDisponibles
      : platsDisponibles.filter(
        (plat) => plat.categorie === categorie
      );

  const formatPrix = (prix: number) =>
    new Intl.NumberFormat("fr-FR").format(prix) + " FCFA";

  const allerCommande = () => {
    if (panier.length === 0) {
      alert("Votre panier est vide.");
      return;
    }

    router.push("/commande");
  };

  const suivreCommande = () => {
    if (!derniereCommande) return;

    router.push(`/suivi?commande=${derniereCommande}`);
  };

  return (
    <main className="min-h-screen bg-[#FBF3EA] text-[#2B2019]">

      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-[#EAE0D5] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#D9631B]">
              DÉLICE DE ISA
            </h1>

            <p className="text-xs text-[#2F5233]">
              Des plats faits avec amour ❤️
            </p>
          </div>

          <div className="flex items-center gap-3">

            {/* 📍 MA COMMANDE EN COURS */}
            {derniereCommande && (
              <button
                onClick={suivreCommande}
                className="rounded-full bg-[#2F5233] px-4 py-3 text-sm font-bold text-white shadow-md transition hover:scale-105"
              >
                📍 Ma commande
              </button>
            )}

            {/* 🛒 PANIER */}
            <button
              onClick={() =>
                document
                  .getElementById("panier")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="relative rounded-full bg-[#D9631B] px-5 py-3 font-semibold text-white shadow-md transition hover:scale-105"
            >
              🛒 Panier

              {nombreArticles > 0 && (
                <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#2F5233] text-xs text-white">
                  {nombreArticles}
                </span>
              )}
            </button>

          </div>

        </div>
      </header>

      {/* 📍 BLOC COMMANDE EN COURS */}
      {derniereCommande && (
        <section className="px-5 pt-6">
          <div className="mx-auto max-w-7xl">

            <div className="flex flex-col gap-4 rounded-3xl bg-[#2F5233] p-5 text-white shadow-lg sm:flex-row sm:items-center sm:justify-between">

              <div>
                <p className="text-sm font-semibold text-green-100">
                  📍 Vous avez une commande en cours
                </p>

                <p className="mt-1 text-lg font-black">
                  #{derniereCommande}
                </p>

                <p className="mt-1 text-sm text-green-100">
                  Consultez son évolution en temps réel.
                </p>
              </div>

              <button
                onClick={suivreCommande}
                className="rounded-full bg-white px-6 py-3 font-black text-[#2F5233] transition hover:scale-105"
              >
                Suivre ma commande →
              </button>

            </div>

          </div>
        </section>
      )}

      {/* HERO */}
      <section className="bg-gradient-to-br from-[#D9631B] to-[#A8440F] px-5 py-20 text-white">

        <div className="mx-auto max-w-7xl">

          <div className="max-w-2xl">

            <p className="mb-4 font-semibold uppercase tracking-[0.2em] text-orange-100">
              Bienvenue chez
            </p>

            <h2 className="text-5xl font-black leading-tight md:text-7xl">
              DÉLICE
              <br />
              DE ISA
            </h2>

            <p className="mt-6 max-w-xl text-lg leading-8 text-orange-50">
              Découvrez nos délicieux plats préparés avec passion et
              commandez facilement en ligne.
            </p>

            <button
              onClick={() =>
                document
                  .getElementById("menu")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="mt-8 rounded-full bg-white px-7 py-4 font-bold text-[#D9631B] shadow-lg transition hover:scale-105"
            >
              Découvrir le menu →
            </button>

          </div>

        </div>

      </section>

      {/* INFORMATIONS */}
      <section className="mx-auto grid max-w-7xl gap-4 px-5 py-8 md:grid-cols-3">

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="text-3xl">🚚</div>

          <h3 className="mt-3 font-bold">
            Livraison
          </h3>

          <p className="mt-1 text-sm text-gray-600">
            Faites-vous livrer votre commande.
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="text-3xl">🍽️</div>

          <h3 className="mt-3 font-bold">
            Plats savoureux
          </h3>

          <p className="mt-1 text-sm text-gray-600">
            Des recettes préparées avec soin.
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="text-3xl">💬</div>

          <h3 className="mt-3 font-bold">
            Commande facile
          </h3>

          <p className="mt-1 text-sm text-gray-600">
            Commandez en quelques clics.
          </p>
        </div>

      </section>

      {/* MENU */}
      <section
        id="menu"
        className="mx-auto max-w-7xl px-5 py-12"
      >

        <div className="mb-8">

          <p className="font-semibold uppercase tracking-widest text-[#D9631B]">
            Notre carte
          </p>

          <h2 className="mt-2 text-4xl font-black">
            Qu&apos;est-ce qui vous ferait plaisir ?
          </h2>

        </div>

        {/* CATEGORIES */}
        <div className="mb-8 flex gap-3 overflow-x-auto pb-2">

          {categories.map((cat) => (

            <button
              key={cat}
              onClick={() => setCategorie(cat)}
              className={`whitespace-nowrap rounded-full px-5 py-3 font-semibold transition ${categorie === cat
                ? "bg-[#D9631B] text-white"
                : "bg-white text-[#2B2019] shadow-sm hover:bg-[#F3E7DC]"
                }`}
            >
              {cat}
            </button>

          ))}

        </div>

        {/* CHARGEMENT */}
        {chargementPlats && (
          <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
            <div className="text-5xl">🍽️</div>

            <p className="mt-4 font-semibold">
              Chargement du menu...
            </p>
          </div>
        )}

        {/* ERREUR */}
        {!chargementPlats && erreurPlats && (
          <div className="rounded-3xl bg-white p-10 text-center shadow-sm">

            <div className="text-5xl">😕</div>

            <p className="mt-4 font-semibold text-red-600">
              {erreurPlats}
            </p>

            <button
              onClick={() => window.location.reload()}
              className="mt-5 rounded-full bg-[#D9631B] px-6 py-3 font-bold text-white"
            >
              Réessayer
            </button>

          </div>
        )}

        {/* AUCUN PLAT */}
        {!chargementPlats &&
          !erreurPlats &&
          platsFiltres.length === 0 && (
            <div className="rounded-3xl bg-white p-10 text-center shadow-sm">

              <div className="text-6xl">🍽️</div>

              <h3 className="mt-4 text-xl font-bold">
                Aucun plat disponible
              </h3>

              <p className="mt-2 text-gray-600">
                Le menu sera bientôt disponible.
              </p>

            </div>
          )}

        {/* PLATS */}
        {!chargementPlats &&
          !erreurPlats &&
          platsFiltres.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

              {platsFiltres.map((plat) => (

                <article
                  key={plat.id}
                  className="overflow-hidden rounded-3xl bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                >

                  {/* IMAGE / EMOJI */}
                  <div className="flex h-52 items-center justify-center bg-gradient-to-br from-[#F6D8C2] to-[#FBEFE5] text-8xl">

                    {plat.image ? (
                      <img
                        src={plat.image}
                        alt={plat.nom}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      plat.emoji
                    )}

                  </div>

                  <div className="p-6">

                    <div className="flex items-start justify-between gap-3">

                      <h3 className="text-xl font-bold">
                        {plat.nom}
                      </h3>

                      <span className="rounded-full bg-[#FBEFE5] px-3 py-1 text-xs font-bold text-[#D9631B]">
                        {plat.categorie}
                      </span>

                    </div>

                    <p className="mt-3 text-sm leading-6 text-gray-600">
                      {plat.description}
                    </p>

                    <div className="mt-6 flex items-center justify-between">

                      <span className="text-lg font-black text-[#2F5233]">
                        {formatPrix(plat.prix)}
                      </span>

                      <button
                        onClick={() =>
                          ajouterAuPanier({
                            id: plat.id,
                            nom: plat.nom,
                            prix: plat.prix,
                            quantite: 1,
                          })
                        }
                        className="rounded-full bg-[#D9631B] px-5 py-3 font-bold text-white transition hover:bg-[#B84F12]"
                      >
                        + Ajouter
                      </button>

                    </div>

                  </div>

                </article>

              ))}

            </div>
          )}

      </section>

      {/* PANIER */}
      <section
        id="panier"
        className="bg-white px-5 py-16"
      >

        <div className="mx-auto max-w-4xl">

          <div className="mb-8">

            <p className="font-semibold uppercase tracking-widest text-[#D9631B]">
              Votre sélection
            </p>

            <h2 className="mt-2 text-4xl font-black">
              Votre panier 🛒
            </h2>

          </div>

          {panier.length === 0 ? (

            <div className="rounded-3xl border border-dashed border-[#EAE0D5] bg-[#FBF3EA] p-10 text-center">

              <div className="text-6xl">
                🛒
              </div>

              <h3 className="mt-4 text-xl font-bold">
                Votre panier est vide
              </h3>

              <p className="mt-2 text-gray-600">
                Ajoutez vos plats préférés pour commencer votre commande.
              </p>

            </div>

          ) : (

            <div className="space-y-4">

              {panier.map((item) => (

                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-2xl border border-[#EAE0D5] p-5"
                >

                  <div>

                    <h3 className="font-bold">
                      {item.nom}
                    </h3>

                    <p className="text-sm text-gray-500">
                      {item.quantite} × {formatPrix(item.prix)}
                    </p>

                  </div>

                  <span className="font-black text-[#2F5233]">
                    {formatPrix(item.prix * item.quantite)}
                  </span>

                </div>

              ))}

              <div className="rounded-2xl bg-[#2F5233] p-6 text-white">

                <div className="flex items-center justify-between">

                  <span className="text-lg">
                    Total
                  </span>

                  <span className="text-2xl font-black">
                    {formatPrix(totalPanier)}
                  </span>

                </div>

                <button
                  onClick={allerCommande}
                  className="mt-5 w-full rounded-full bg-[#D9631B] px-6 py-4 font-bold transition hover:bg-[#B84F12]"
                >
                  Passer la commande →
                </button>

              </div>

            </div>

          )}

        </div>

      </section>

      {/* FOOTER */}
      <footer className="bg-[#2B2019] px-5 py-10 text-white">

        <div className="mx-auto max-w-7xl text-center">

          <h2 className="text-2xl font-black text-[#D9631B]">
            DÉLICE DE ISA
          </h2>

          <p className="mt-3 text-sm text-gray-300">
            Des plats faits avec amour ❤️
          </p>

          <div className="mt-6 text-sm text-gray-400">
            © {new Date().getFullYear()} DÉLICE DE ISA — Tous droits réservés.
          </div>

        </div>

      </footer>

    </main>
  );
}