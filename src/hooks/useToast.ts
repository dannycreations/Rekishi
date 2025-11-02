import { useToastStore } from '../stores/useToastStore';

export const useToast = () => {
  const addToast = useToastStore((state) => state.addToast);
  return { addToast };
};
