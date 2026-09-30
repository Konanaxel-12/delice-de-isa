
import { NextResponse } from "next/server";
import { adminDb } from "../../../firebase-admin";

type Parametres = {
    params: Promise<{
        id: string;
    }>;
};

export async function PATCH(
    request: Request,
    { params }: Parametres
) {
    try {
        const { id } = await params;

        const donnees = await request.json();
        const statut = donnees.statut;

        const statutsAutorises = [
            "recue",
            "confirmee",
            "preparation",
            "prete",
            "livraison",
            "livree",
            "annulee",
        ];

        if (
            typeof statut !== "string" ||
            !statutsAutorises.includes(statut)
        ) {
            return NextResponse.json(
                {
                    erreur:
                        "Statut de commande invalide.",
                },
                { status: 400 }
            );
        }

        const commandeRef = adminDb
            .collection("commandes")
            .doc(id);

        const commande = await commandeRef.get();

        if (!commande.exists) {
            return NextResponse.json(
                {
                    erreur:
                        "Commande introuvable.",
                },
                { status: 404 }
            );
        }

        await commandeRef.update({
            statut: statut,
        });

        return NextResponse.json({
            succes: true,
            id: id,
            statut: statut,
        });
    } catch (erreur) {
        console.error(
            "Erreur API modification commande :",
            erreur
        );

        return NextResponse.json(
            {
                erreur:
                    "Impossible de modifier la commande.",
            },
            { status: 500 }
        );
    }
}
