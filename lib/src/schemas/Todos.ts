import { modules } from "./Form.ts";

export type TodosResponseType = {
    name: string | null;
    roles: string[];
    todos: {
        id: number;
        module: (typeof modules)[number];
        title: string;
        description: string | null;
        link: string | null;
        assignedTo: string;
        createdBy: string;
        createdAt: string;
        deadline: string | null;
        metadata: unknown;
    }[];
};
