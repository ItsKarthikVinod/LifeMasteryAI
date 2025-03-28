import { useSpring, animated } from 'react-spring';

const AnimatedButton = () => {
  const props = useSpring({
    transform: 'scale(1.1)',
    from: { transform: 'scale(1)' },
    reset: true,
    reverse: true,
    config: { tension: 210, friction: 20 },
  });

  return <animated.button style={props} className="bg-teal-500 text-white px-6 py-3 rounded-full text-lg">Animated Button</animated.button>;
};
