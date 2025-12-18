"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import {
  useCollections,
  useDeleteCollection,
} from "@/lib/hooks/useCollections";

export default function ManageCollectionsPage() {
  const router = useRouter();
  const { data: collections = [], isLoading } = useCollections();
  const deleteCollection = useDeleteCollection();
  const [deletingId, setDeletingId] = useState<string | null>(null);
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
      console.error("Failed to delete collection:", error);
      alert("Failed to delete collection. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, collectionId: null, collectionName: null });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/"
                className="text-blue-600 hover:text-blue-700 text-sm mb-1 inline-block"
              >
                Back to Home
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">
                Manage Collections
              </h1>
            </div>
            <Link href="/collections/create">
              <Button variant="primary">Create New Collection</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4 animate-pulse">学</div>
            <p className="text-gray-600">Loading collections...</p>
          </div>
        ) : userCollections.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              No Custom Collections
            </h2>
            <p className="text-gray-600 mb-6">
              You haven't created any custom collections yet.
            </p>
            <Link href="/collections/create">
              <Button variant="primary">Create Your First Collection</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {userCollections.map((collection) => (
              <div
                key={collection.id}
                className="bg-white rounded-lg shadow p-6 flex items-center justify-between"
              >
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    {collection.name}
                  </h3>
                  {collection.description && (
                    <p className="text-gray-600 mb-2">
                      {collection.description}
                    </p>
                  )}
                  <div className="flex gap-4 text-sm text-gray-500">
                    <span>{collection.characterIds.length} characters</span>
                    <span className="capitalize">
                      {collection.studyMode.replace("_", " ")}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <Link href={`/study/${collection.id}`}>
                    <Button variant="primary" size="sm">
                      Study
                    </Button>
                  </Link>
                  <Link href={`/collections/edit/${collection.id}`}>
                    <Button variant="secondary" size="sm">
                      Edit
                    </Button>
                  </Link>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteClick(collection.id, collection.name)}
                    disabled={deletingId === collection.id}
                  >
                    {deletingId === collection.id ? "Deleting..." : "Delete"}
                  </Button>
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
            <Button variant="secondary" onClick={handleDeleteCancel}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteConfirm}
              disabled={!!deletingId}
            >
              {deletingId ? "Deleting..." : "Delete"}
            </Button>
          </>
        }
      >
        <p>
          Are you sure you want to delete <strong>"{deleteModal.collectionName}"</strong>?
        </p>
        <p className="mt-2 text-sm">
          This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
