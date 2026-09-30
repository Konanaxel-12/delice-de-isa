import { NextResponse } from "next/server";
import { adminDb } from "@/app/firebase-admin";

// 📥 RÉCUPÉRER TOUS LES PLATS
export async function GET() {
    try {
        const snapshot = await adminDb
            .collection("plats")
            .orderBy("nom", "asc")
            .get();

        const plats = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));

        return NextResponse.json(plats);
    } catch (error) {
        console.error("Erreur récupération plats :", error);

        return NextResponse.json(
            { error: "Impossible de récupérer les plats." },
            { status: 500 }
        );
    }
}

// ➕ AJOUTER UN PLAT
export async function POST(request: Request) {
    try {
        const body = await request.json();

        const {
            nom,
            description,
            prix,
            categorie,
            emoji,
            image,
            disponible,
        } = body;

        if (!nom || !description || !prix || !categorie) {
            return NextResponse.json(
                {
                    error:
                        "Le nom, la description, le prix et la catégorie sont obligatoires.",
                },
                { status: 400 }
            );
        }

        const nouveauPlat = {
            nom,
            description,
            prix: Number(prix),
            categorie,
            emoji: emoji || "🍽️",
            image: image || "",
            disponible: disponible !== false,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const docRef = await adminDb
            .collection("plats")
            .add(nouveauPlat);

        return NextResponse.json(
            {
                id: docRef.id,
                ...nouveauPlat,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Erreur ajout plat :", error);

        return NextResponse.json(
            { error: "Impossible d'ajouter le plat." },
            { status: 500 }
        );
    }
}