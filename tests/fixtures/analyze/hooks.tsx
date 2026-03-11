import { usePagination, useDisclosure } from "@heroui/react";

export function useLegacy() {
    const p = usePagination();
    const d = useDisclosure();
    return { p, d };
}
