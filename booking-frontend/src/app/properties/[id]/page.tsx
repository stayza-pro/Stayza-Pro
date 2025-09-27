import PropertyDetailClient from "./PropertyDetailClient";

type PropertyPageParams = {
  params: {
    id: string;
  };
};

export default function PropertyDetailPage({ params }: PropertyPageParams) {
  return <PropertyDetailClient propertyId={params.id} />;
}
