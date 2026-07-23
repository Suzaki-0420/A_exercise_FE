"use client";

import { UpdateProductComplete } from "@/components/product/edit/UpdateProductComplete";
import { UpdateProductConfirm } from "@/components/product/edit/UpdateProductConfirm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCallback, useState } from "react";

export type UpdateModalStep = "closed" | "confirm" | "complete";

type UpdateProductModalProps = {
  step: UpdateModalStep;
  onBackToInput: () => void;
  onUpdateCompleted: () => void;
};

/**
 * 商品変更（入力）画面上に確認・完了を表示するモーダル
 */
export const UpdateProductModal = ({
  step,
  onBackToInput,
  onUpdateCompleted,
}: UpdateProductModalProps) => {
  const [isUpdatePending, setIsUpdatePending] = useState(false);
  const isOpen = step !== "closed";
  const canReturnToInput = step === "confirm" && !isUpdatePending;

  const requestClose = useCallback(() => {
    if (canReturnToInput) {
      onBackToInput();
    }
  }, [canReturnToInput, onBackToInput]);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          requestClose();
        }
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="max-h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] min-w-0 max-w-3xl scroll-pb-6 overflow-x-hidden overflow-y-auto bg-transparent p-0 pb-6 ring-0"
        onEscapeKeyDown={(event) => {
          if (!canReturnToInput) {
            event.preventDefault();
          }
        }}
        onPointerDownOutside={(event) => {
          if (!canReturnToInput) {
            event.preventDefault();
          }
        }}
      >
        <DialogTitle className="sr-only">
          {step === "complete" ? "商品変更（完了）" : "商品変更（確認）"}
        </DialogTitle>
        <DialogDescription className="sr-only">
          {step === "complete"
            ? "商品情報の変更が完了しました。"
            : "変更する商品情報を確認します。"}
        </DialogDescription>

        {step === "confirm" && (
          <UpdateProductConfirm
            variant="modal"
            options={{
              onBackToInput,
              onUpdateSuccess: onUpdateCompleted,
              onUpdatePendingChange: setIsUpdatePending,
            }}
          />
        )}

        {step === "complete" && <UpdateProductComplete variant="modal" />}
      </DialogContent>
    </Dialog>
  );
};
