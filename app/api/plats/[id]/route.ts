import { NextResponse } from "next/server";
import { adminDb } from "@/app/firebase-admin";

// ✏️ MODIFIER UN PLAT
export async function PATCH(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const body = await request.json();

        const platRef = adminDb.collection("plats").doc(id);
        const platSnapshot = await platRef.get();

        if (!platSnapshot.exists) {
            return NextResponse.json(
                { error: "Plat introuvable." },
                { status: 404 }
            );
        }

        const donneesModifiees = {
            ...body,
            ...(body.prix !== undefined
                ? { prix: Number(body.prix) }
                : {}),
            updatedAt: new Date(),
        };

        await platRef.update(donneesModifiees);

        const platMisAJour = await platRef.get();

        return NextResponse.json({
            id: platMisAJour.id,
            ...platMisAJour.data(),
        });
    } catch (error) {
        console.error("Erreur modification plat :", error);

        return NextResponse.json(
            { error: "Impossible de modifier le plat." },
            { status: 500 }
        );
    }
}

// 🗑️ SUPPRIMER UN PLAT
export async function DELETE(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;

        const platRef = adminDb.collection("plats").doc(id);
        const platSnapshot = await platRef.get();

        if (!platSnapshot.exists) {
            return NextResponse.json(
                { error: "Plat introuvable." },
                { status: 404 }
            );
        }

        await platRef.delete();

        return NextResponse.json({
            success: true,
            message: "Plat supprimé avec succès.",
        });
    } catch (error) {
        console.error("Erreur suppression plat :", error);

        return NextResponse.json(
            { error: "Impossible de supprimer le plat." },
            { status: 500 }
        );
    }
}