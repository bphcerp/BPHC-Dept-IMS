import { Link, useNavigate } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export interface Member {
    name: string;
    email: string;
    roles: string[];
}

export default function MemberList({ members }: { members: Member[] }) {
    const navigate = useNavigate();
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {members.map((member) => (
                <Link to={`${member.email}`} key={member.email}>
                    <Card className="hover:shadow-md transition-shadow duration-200 h-full">
                        <CardContent className="p-4 gap-2 flex flex-col">
                            <h2 className="text-xl font-semibold">{member.name}</h2>
                            <p className="text-muted-foreground">{member.email}</p>
                            <div className="flex flex-wrap gap-2">
                                {member.roles.map((role) => (
                                    <Badge key={role} variant="secondary" onClick={e => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        navigate(`../roles/${role}`)
                                    }}>
                                        {role}
                                    </Badge>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            ))}
        </div>
    )
}

