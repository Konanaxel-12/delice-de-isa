import { NextResponse } from "next/server";
import { adminDb } from "../../firebase-admin";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);

        const token = searchParams.get("token");

        if (!token) {
            return NextResponse.json(
                {
                    erreur:
                        "Token de suivi manquant.",
                },
                { status: 400 }
            );
        }

        const snapshot = await adminDb
            .collection("commandes")
            .where("trackingToken", "==", token)
            .limit(1)
            .get();

        if (snapshot.empty) {
            return NextResponse.json(
                {
                    erreur:
                        "Commande introuvable.",
                },
                { status: 404 }
            );
        }

        const document = snapshot.docs[0];
        const commande = document.data();

        // On ne renvoie que les informations nécessaires
        // au suivi client.
        const commandePublique = {
            id: commande.id,
            date: commande.date,
            articles: commande.articles,
            total: commande.total,
            nom: commande.nom,
            telephone: commande.telephone,
            modeLivraison: commande.modeLivraison,
            adresse: commande.adresse,
            instructions: commande.instructions,
            statut: commande.statut,
        };

        return NextResponse.json({
            succes: true,
            commande: commandePublique,
        });
    } catch (erreur) {
        console.error(
            "Erreur API suivi :",
            erreur
        );

        return NextResponse.json(
            {
                erreur:
                    "Impossible de récupérer le suivi de la commande.",
            },
            { status: 500 }
        );
    }
}