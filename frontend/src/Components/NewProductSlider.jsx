import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import HomeCard from "./HomeCard";
import "../Pages/Home.css";
import { NewProductData } from '../Data/ProductData';

function NewProductSlider() {
  const settings = {
    dots: true,
    infinite: true,
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 1500,
    pauseOnHover: true,
    responsive: [
      {
        breakpoint: 1024, // tablets
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 768, // mobile devices
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 560, // mobile devices
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
    ],
  };

  return (
    <section className="latest-releases">
      <div className="section-header">
        <h2>Our Latest Releases</h2>
        <p>Discover our newest additions to the collection</p>
      </div>
      <div className="slider-container">
        <Slider {...settings}>
          {NewProductData.map((product, i) => (
            <div key={i}>
              <HomeCard products={product} />
            </div>
          ))}
        </Slider>
      </div>
    </section>
  );
}

export default NewProductSlider;
