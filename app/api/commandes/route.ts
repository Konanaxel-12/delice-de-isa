import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { adminDb } from "../../firebase-admin";

export async function GET() {
    try {
        const snapshot = await adminDb
            .collection("commandes")
            .orderBy("date", "desc")
            .get();

        const commandes = snapshot.docs.map((document) => ({
            id: document.id,
            ...document.data(),
        }));

        return NextResponse.json({
            succes: true,
            commandes,
        });
    } catch (erreur) {
        console.error(
            "Erreur API récupération commandes :",
            erreur
        );

        return NextResponse.json(
            {
                erreur:
                    "Impossible de récupérer les commandes.",
            },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const donnees = await request.json();

        if (
            !donnees.nom ||
            !donnees.telephone ||
            !donnees.articles ||
            !Array.isArray(donnees.articles) ||
            donnees.articles.length === 0
        ) {
            return NextResponse.json(
                {
                    erreur:
                        "Informations de commande incomplètes.",
                },
                { status: 400 }
            );
        }

        const annee = new Date().getFullYear();

        const snapshot = await adminDb
            .collection("commandes")
            .get();

        let prochainNumero = 1;

        snapshot.forEach((document) => {
            const resultat = document.id.match(
                /CMD-\d+-(\d+)/
            );

            if (resultat) {
                const numero = Number(resultat[1]);

                if (numero >= prochainNumero) {
                    prochainNumero = numero + 1;
                }
            }
        });

        const id = `CMD-${annee}-${String(
            prochainNumero
        ).padStart(3, "0")}`;

        // Token secret et aléatoire pour le suivi client
        const trackingToken = randomBytes(32).toString("hex");

        const nouvelleCommande = {
            id,
            trackingToken,
            date: new Date().toISOString(),
            articles: donnees.articles,
            total: donnees.total ?? 0,
            nom: donnees.nom,
            telephone: donnees.telephone,
            modeLivraison:
                donnees.modeLivraison ?? "retrait",
            adresse: donnees.adresse ?? "",
            instructions: donnees.instructions ?? "",
            statut: "recue",
        };

        await adminDb
            .collection("commandes")
            .doc(id)
            .set(nouvelleCommande);

        return NextResponse.json(
            {
                succes: true,
                commande: nouvelleCommande,
            },
            { status: 201 }
        );
    } catch (erreur) {
        console.error(
            "Erreur API commande :",
            erreur
        );

        return NextResponse.json(
            {
                erreur:
                    "Impossible d'enregistrer la commande.",
            },
            { status: 500 }
        );
    }
}