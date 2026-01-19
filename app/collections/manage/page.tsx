"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Modal } from "@/components/ui/Modal";
import {
  useCollections,
  useDeleteCollection,
} from "@/lib/hooks/useCollections";
import { useTheme } from "@/lib/providers/ThemeProvider";
import MinimalHeader from "@/components/MinimalHeader";
import MenuDrawer from "@/components/MenuDrawer";

export default function ManageCollectionsPage() {
  const router = useRouter();
  const { data: collections = [], isLoading } = useCollections();
  const deleteCollection = useDeleteCollection();
  const { colors } = useTheme();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    collectionId: string | null;
    collectionName: string | null;
  }>({
    isOpen: false,
    collectionId: null,
    collectionName: null,
  });

  const userCollections = collections.filter((c) => c.type === "user");

  // Handle scroll for sticky header shadow
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleDeleteClick = (id: string, name: string) => {
    setDeleteModal({
      isOpen: true,
      collectionId: id,
      collectionName: name,
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.collectionId) return;

    setDeletingId(deleteModal.collectionId);
    try {
      await deleteCollection.mutateAsync(deleteModal.collectionId);
      setDeleteModal({ isOpen: false, collectionId: null, collectionName: null });
    } catch (error) {
      alert("Failed to delete collection. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, collectionId: null, collectionName: null });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Menu Drawer */}
      <MenuDrawer isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      {/* Minimal Header */}
      <MinimalHeader
        showMenu
        onMenuClick={() => setMenuOpen(true)}
      />

      <main className="max-w-4xl mx-auto px-4 pt-24 pb-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-foreground">
            Manage Collections
          </h1>
          <Link
            href="/collections/create"
            className="px-4 py-2 bg-[var(--accent)] text-[var(--accent-text)] rounded-full text-sm font-medium shadow-md hover:shadow-lg transition-shadow"
          >
            Create New
          </Link>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4 animate-pulse text-[var(--accent)]">学</div>
            <p className="text-muted">Loading collections...</p>
          </div>
        ) : userCollections.length === 0 ? (
          <div className="bg-card-bg rounded-2xl p-12 text-center border border-border">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              No Custom Collections
            </h2>
            <p className="text-muted mb-6">
              You haven't created any custom collections yet.
            </p>
            <Link
              href="/collections/create"
              className="inline-block px-6 py-3 bg-[var(--accent)] text-[var(--accent-text)] rounded-full font-medium shadow-lg hover:shadow-xl transition-shadow"
            >
              Create Your First Collection
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {userCollections.map((collection) => (
              <div
                key={collection.id}
                className="bg-card-bg rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-border shadow-sm"
              >
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-foreground mb-1">
                    {collection.name}
                  </h3>
                  {collection.description && (
                    <p className="text-muted mb-2">
                      {collection.description}
                    </p>
                  )}
                  <div className="flex gap-4 text-sm text-muted">
                    <span>{collection.characterIds.length} Kanji</span>
                    <span className="capitalize">
                      {collection.studyMode.replace("_", " ")}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link
                    href={`/study/${collection.id}`}
                    className="px-4 py-2 bg-[var(--accent)] text-[var(--accent-text)] rounded-full text-sm font-medium shadow-md hover:shadow-lg transition-shadow"
                  >
                    Study
                  </Link>
                  <Link
                    href={`/collections/edit/${collection.id}`}
                    className="px-4 py-2 border border-border text-foreground rounded-full text-sm font-medium hover:bg-card-bg transition"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDeleteClick(collection.id, collection.name)}
                    disabled={deletingId === collection.id}
                    className="px-4 py-2 border border-border text-muted rounded-full text-sm font-medium hover:bg-card-bg transition disabled:opacity-50"
                  >
                    {deletingId === collection.id ? "..." : "Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={handleDeleteCancel}
        title="Delete Collection"
        footer={
          <>
            <button
              onClick={handleDeleteCancel}
              className="px-4 py-2 border border-border text-foreground rounded-full text-sm font-medium hover:bg-card-bg transition"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteConfirm}
              disabled={!!deletingId}
              className="px-4 py-2 bg-[var(--accent)] text-[var(--accent-text)] rounded-full text-sm font-medium hover:shadow-lg transition disabled:opacity-50"
            >
              {deletingId ? "Deleting..." : "Delete"}
            </button>
          </>
        }
      >
        <p className="text-foreground">
          Are you sure you want to delete <strong>"{deleteModal.collectionName}"</strong>?
        </p>
        <p className="mt-2 text-sm text-muted">
          This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
