export type ActionState = {
  status: "idle" | "success" | "error";
  message: string;
  key: number;
};

export const initialActionState: ActionState = {
  status: "idle",
  message: "",
  key: 0,
};

export function actionSuccess(message: string): ActionState {
  return {
    status: "success",
    message,
    key: Date.now(),
  };
}

export function actionError(message: string): ActionState {
  return {
    status: "error",
    message,
    key: Date.now(),
  };
}
