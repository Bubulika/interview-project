"use server";

import { z } from "zod";
import { sql } from "@vercel/postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";
import { AuthError } from "next-auth";
import { cookies } from "next/headers";

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string({
    invalid_type_error: "Please select a customer.",
  }),
  amount: z.coerce
    .number()
    .gt(0, { message: "Please enter an amount greater than $0." }),
  status: z.enum(["pending", "paid"], {
    invalid_type_error: "Please select an invoice status.",
  }),
  oldStatus: z.enum(["pending", "paid", "cancelled", "overdue"], {
    invalid_type_error: "Please select an invoice status.",
  }),
  date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });
const UpdateInvoice = FormSchema.omit({ date: true, id: true });

export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};

export async function createInvoice(prevState: State, formData: FormData) {
  // Validate form fields using Zod
  const validatedFields = CreateInvoice.safeParse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });

  // If form validation fails, return errors early. Otherwise, continue.
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Create Invoice.",
    };
  }

  // Prepare data for insertion into the database
  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split("T")[0];

  // Insert data into the database
  let query;
  try {
    if (status === "pending") {
      query = await sql`
      INSERT INTO invoices (customer_id, amount, status, date, due_date)
      VALUES (${customerId}, ${amountInCents}, ${status}, ${date}, (NOW() + INTERVAL '14 days')::date)
      RETURNING id;
    `;
    } else {
      query = await sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
      RETURNING id;
    `;
    }
    const invoiceId = query.rows[0].id;
    console.log("aqamde modis");
    await insertLogs(invoiceId, "First creation", status);
    console.log("agar modis");
  } catch (error) {
    // If a database error occurs, return a more specific error.
    return {
      message: "Database Error: Failed to Create Invoice.",
    };
  }

  // Revalidate the cache for the invoices page and redirect the user.
  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}

export async function updateInvoice(
  id: string,
  prevState: State,
  formData: FormData
) {
  const validatedFields = UpdateInvoice.safeParse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
    oldStatus: formData.get("oldStatus"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Update Invoice.",
    };
  }

  const { customerId, amount, status, oldStatus } = validatedFields.data;
  const amountInCents = amount * 100;

  try {
    await insertLogs(id, oldStatus, status, true);
    if (status === "pending") {
      await sql`
      UPDATE invoices
      SET 
        customer_id = ${customerId},
        amount = ${amountInCents},
        status = ${status},
        due_date = (NOW() + INTERVAL '14 days')::date
      WHERE id = ${id}
    `;
    } else {
      await sql`
      UPDATE invoices
      SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
      WHERE id = ${id}
    `;
    }
  } catch (error) {
    return { message: "Database Error: Failed to Update Invoice." };
  }

  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}

export async function deleteInvoice(id: string) {
  // throw new Error('Failed to Delete Invoice');
  console.log(id);
  try {
    await sql`UPDATE invoices SET status = 'cancelled' WHERE id = ${id}`;
  } catch (error) {
    return { message: "Database Error: Failed to Delete Invoice." };
  }
  revalidatePath("/dashboard/invoices");
}

export async function updateInvoiceStatus(formData: FormData) {
  const id = formData.get("invoiceId") as string;
  const status = formData.get("status") as string;

  // Validate input data
  if (!id || !status) {
    console.error("Invalid data", { id, status });
    return { message: "Invalid data provided." };
  }

  console.log("Updating invoice status", { id, status });

  try {
    // Perform the update query
    const result = await sql`
      UPDATE invoices
      SET status = ${status}
      WHERE id = ${id}
      RETURNING *`; // RETURNING clause can help you debug if the update happened correctly

    if (result.rowCount === 0) {
      console.error("Invoice not found", { id });
      return { message: "Invoice not found." };
    }

    // Optionally, revalidate the page to reflect the updated data
    revalidatePath("/dashboard/invoices");

    console.log("Invoice status updated successfully");

    return { message: "Invoice status updated successfully." };
  } catch (error) {
    console.error("Error updating invoice status", error);
    return { message: "Error during updating status" };
  }
}

export async function updateOverdueInvoices() {
  try {
    await sql`
      UPDATE invoices
      SET status = 'overdue'
      WHERE status = 'pending' AND due_date < NOW()
    `;
  } catch (error) {
    console.error("Error updating invoices:", error);
    throw new Error("Failed to update overdue invoices");
  }
  revalidatePath("/dashboard/invoices");
}

export async function authenticate(
  prevState: string | undefined,
  formData: FormData
) {
  try {
    await signIn("credentials", formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "Invalid credentials.";
        default:
          return "Something went wrong.";
      }
    }
    throw error;
  }
}

export async function LogAfterTabs(formadata: FormData) {
  const clickedStatus = (formadata.get("status") as string) || "";
  cookies().set("status", clickedStatus, {
    maxAge: 60 * 60 * 24 * 7, // Cookie will expire in 7 days
    path: "/",
  });
}

export async function insertLogs(
  invoiceId: string,
  prevStatus: string,
  newStatus: string,
  restored = false
) {
  const session = await auth();
  const user = session?.user?.email;
  console.log(user);
  console.log("shemovida");
  try {
    console.log("start insert");
    await sql`
    INSERT INTO invoice_audit_logs (invoice_id, new_status, old_status,username, restored)
    VALUES (${invoiceId}, ${newStatus}, ${prevStatus}, ${user}, ${restored});
  `;
    console.log("logs inserted successfully");
  } catch (error) {
    console.log(error);
    return { message: "Database error during insert log" };
  }
  revalidatePath("/dashboard/invoices");
}
