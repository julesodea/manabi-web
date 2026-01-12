"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  const [scrolled, setScrolled] = useState(false);
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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 bg-white duration-300 ${
          scrolled ? "shadow-md py-3" : "py-4 border-b border-gray-100"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-r from-[#5B7FFF] to-[#4A6FEE] rounded-full flex items-center justify-center text-white font-bold">
                  学
                </div>
                <span className="text-[#5B7FFF] text-xl font-bold tracking-tight hidden sm:block">
                  Manabi
                </span>
              </Link>
              <div className="hidden sm:block h-6 w-px bg-gray-200" />
              <h1 className="text-lg font-semibold text-gray-900 hidden sm:block">
                Manage Collections
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-full text-sm font-medium transition"
              >
                Home
              </Link>
              <Link
                href="/collections/create"
                className="px-4 py-2 bg-gradient-to-r from-[#5B7FFF] to-[#4A6FEE] text-white rounded-full text-sm font-medium  transition"
              >
                Create New
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-24 pb-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 sm:hidden">
          Manage Collections
        </h1>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4 animate-pulse">学</div>
            <p className="text-gray-600">Loading collections...</p>
          </div>
        ) : userCollections.length === 0 ? (
          <div className="bg-gray-50 rounded-2xl p-12 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              No Custom Collections
            </h2>
            <p className="text-gray-600 mb-6">
              You haven't created any custom collections yet.
            </p>
            <Link
              href="/collections/create"
              className="inline-block px-6 py-3 bg-gradient-to-r from-[#5B7FFF] to-[#4A6FEE] text-white rounded-full font-medium  transition"
            >
              Create Your First Collection
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {userCollections.map((collection) => (
              <div
                key={collection.id}
                className="bg-gray-50 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-gray-100"
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
                    <span>{collection.characterIds.length} kanji</span>
                    <span className="capitalize">
                      {collection.studyMode.replace("_", " ")}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link
                    href={`/study/${collection.id}`}
                    className="px-4 py-2 bg-gradient-to-r from-[#5B7FFF] to-[#4A6FEE] text-white rounded-full text-sm font-medium  transition"
                  >
                    Study
                  </Link>
                  <Link
                    href={`/collections/edit/${collection.id}`}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-100 transition"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDeleteClick(collection.id, collection.name)}
                    disabled={deletingId === collection.id}
                    className="px-4 py-2 border border-red-300 text-red-600 rounded-full text-sm font-medium hover:bg-red-50 transition disabled:opacity-50"
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
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-100 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteConfirm}
              disabled={!!deletingId}
              className="px-4 py-2 bg-red-500 text-white rounded-full text-sm font-medium hover:bg-red-600 transition disabled:opacity-50"
            >
              {deletingId ? "Deleting..." : "Delete"}
            </button>
          </>
        }
      >
        <p className="text-gray-700">
          Are you sure you want to delete <strong>"{deleteModal.collectionName}"</strong>?
        </p>
        <p className="mt-2 text-sm text-gray-500">
          This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
