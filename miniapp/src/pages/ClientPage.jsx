import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function ClientPage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/client/points", { replace: true });
  }, [navigate]);

  return null;
}
