type CarouselImage = {
  id: string;
  url: string;
};

type Props = {
  images: CarouselImage[];
};

export function Carousel({ images }: Props) {
  return (
    <section className="animate-fadeCalm rounded-soft border border-borderSubtle bg-surface px-4 py-4 shadow-soft transition-all duration-300 ease-calm" style={{ animationDelay: "140ms" }}>
      <p className="text-[11px] uppercase tracking-[0.15em] text-textMuted">Atmosphere</p>

      {images.length ? (
        <div className="mt-3 -mr-2 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 pr-2">
          {images.map((image) => (
            <figure key={image.id} className="min-w-[80%] snap-center overflow-hidden rounded-[18px]">
              <img
                src={image.url}
                alt="Image atmosphérique"
                className="h-52 w-full object-cover transition duration-300 ease-calm hover:scale-[1.01]"
              />
            </figure>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-textSecondary">Ajoute 3 à 10 images depuis l'admin.</p>
      )}
    </section>
  );
}
