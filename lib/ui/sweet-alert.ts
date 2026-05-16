import Swal from "sweetalert2";

type AlertOptions = {
  title: string;
  text?: string;
};

type ErrorListAlertOptions = {
  title: string;
  messages: string[];
};

const confirmColor = "#dc2626";

function formatMessageList(messages: string[]) {
  return messages.map((message) => `• ${message}`).join("\n\n");
}

export function showErrorAlert({ title, text }: AlertOptions) {
  return Swal.fire({
    icon: "error",
    title,
    text,
    confirmButtonText: "OK",
    confirmButtonColor: confirmColor
  });
}

export function showErrorListAlert({ title, messages }: ErrorListAlertOptions) {
  return Swal.fire({
    icon: "error",
    title,
    text: formatMessageList(messages),
    confirmButtonText: "OK",
    confirmButtonColor: confirmColor
  });
}

export function showUpgradeAlert({ title, text }: AlertOptions) {
  return Swal.fire({
    icon: "warning",
    title,
    text,
    showCancelButton: true,
    confirmButtonText: "Upgrade plan",
    cancelButtonText: "Cancel",
    confirmButtonColor: confirmColor
  }).then((result) => {
    if (result.isConfirmed) {
      window.location.href = "/pricing";
    }
  });
}

export function showSuccessAlert({ title, text }: AlertOptions) {
  return Swal.fire({
    icon: "success",
    title,
    text,
    confirmButtonText: "OK",
    confirmButtonColor: confirmColor
  });
}

export function showInfoAlert({ title, text }: AlertOptions) {
  return Swal.fire({
    icon: "info",
    title,
    text,
    confirmButtonText: "OK",
    confirmButtonColor: confirmColor
  });
}
