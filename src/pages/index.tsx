import { GetServerSideProps } from 'next';

/**
 * Homepage - instantly redirects to dashboard (server-side)
 * Users never see this component render
 */
export default function HomePage() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: '/dashboard',
      permanent: false,
    },
  };
};
