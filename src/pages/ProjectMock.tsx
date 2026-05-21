import { useParams } from "react-router-dom";

const ProjectMock = () => {
  const { id } = useParams<{ id: string }>();
  return <div style={{ padding: 24 }}>mock page (id: {id})</div>;
};

export default ProjectMock;
