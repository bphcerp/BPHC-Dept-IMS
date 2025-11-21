import { AppSidebar } from "@/components/AppSidebar";
import {
  Wallet,
} from "lucide-react"
import { Outlet } from "react-router-dom"

const BudgetLayout = () => {
  return (
    <>
      <AppSidebar sort={false} items={[
        {
          title: "Budget",
          items: [
            {
              title: "Dashboard",
              icon: <Wallet />,
              url: "/budget/dashboard",
              requiredPermissions: [],
            },
          ]
        }
      ]} />

      <div className="h-screen w-full overflow-y-auto">
        <Outlet />
      </div>
    </>
  )
}

export default BudgetLayout
