import { Star, Quote } from "lucide-react";
import { Reveal } from "@/components/Reveal";

const testimonials = [
  {
    quote: "Finally a file sharing solution that takes privacy seriously. We use SafeShare for all our client communications.",
    author: "Dr. Azzam Sleit",
    role: "Professor of Computer Science at KASIT",
    avatar: "AS",
  },
];

const Testimonials = () => {
  return (
    <section id="testimonials" className="py-20 lg:py-28 relative overflow-hidden scroll-mt-20">
      {/* Background accent */}
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-transparent via-card/50 to-transparent" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <Reveal className="text-center mb-12">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-primary mb-3">Testimonials</p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            Trusted by People Who <span className="text-primary">Value Privacy</span>
          </h2>
        </Reveal>

        <div className="max-w-3xl mx-auto grid gap-6">
          {testimonials.map((testimonial, index) => (
            <Reveal key={testimonial.author} delay={index * 0.1}>
              <figure className="relative p-8 sm:p-12 rounded-3xl bg-card border border-border text-center shadow-2xl shadow-black/30">
                <Quote className="h-10 w-10 text-primary/30 mx-auto mb-5" aria-hidden="true" />

                <div className="flex justify-center gap-1 mb-6" role="img" aria-label="Rated 5 out of 5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" aria-hidden="true" />
                  ))}
                </div>

                <blockquote className="text-xl sm:text-2xl font-medium leading-relaxed text-foreground mb-8">
                  “{testimonial.quote}”
                </blockquote>

                <figcaption className="flex items-center justify-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-primary/15 border border-primary/30 text-primary flex items-center justify-center text-sm font-semibold">
                    {testimonial.avatar}
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-foreground">{testimonial.author}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
