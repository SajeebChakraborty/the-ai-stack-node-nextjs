import Swal from "sweetalert2";

type AlertOptions = {
  title: string;
  text?: string;
};

const confirmColor = "#dc2626";

export function showErrorAlert({ title, text }: AlertOptions) {
  return Swal.fire({
    icon: "error",
    title,
    text,
    confirmButtonText: "OK",
    confirmButtonColor: confirmColor
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
