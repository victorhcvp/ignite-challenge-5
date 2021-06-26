/* eslint-disable react/no-danger */
import { GetStaticPaths, GetStaticProps } from 'next';
import { format } from 'date-fns';

import Prismic from '@prismicio/client';
import ptBR from 'date-fns/locale/pt-BR';
import { ReactElement } from 'react';
import Head from 'next/head';
import { RichText } from 'prismic-dom';
import { useRouter } from 'next/router';
import { getPrismicClient } from '../../services/prismic';

import Header from '../../components/Header';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    subtitle: string;
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
  uid: string;
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): ReactElement {
  const router = useRouter();

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  const words = post.data.content.reduce((acc, val) => {
    const text = RichText.asText(val.body);
    const { length } = text.split(/[\s]/).filter(v => v !== '');
    return acc + length;
  }, 0);
  const minutes = Math.ceil(words / 200);

  return (
    <>
      <Head>
        <title>{post.data.title}</title>
      </Head>
      <Header />

      <div
        className={styles.banner}
        style={{ backgroundImage: `url('${post.data.banner.url}')` }}
      />

      <main className={`${styles.container} ${commonStyles.container}`}>
        <article className={styles.post}>
          <h1>{post.data.title}</h1>
          <div className={styles.meta}>
            <span>
              {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
                locale: ptBR,
              })}
            </span>
            <span>{post.data.author}</span>
            <span>{minutes} min</span>
          </div>
          {post.data.content.map(content => {
            return (
              <div key={content.heading}>
                <h2>{content.heading}</h2>
                {content.body.map(body => {
                  return (
                    <div
                      dangerouslySetInnerHTML={{
                        __html: body.text,
                      }}
                    />
                  );
                })}
              </div>
            );
          })}
        </article>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    Prismic.Predicates.at('document.type', 'posts'),
    {
      pageSize: 2,
      fetch: ['posts.title', 'posts.slug'],
    }
  );

  const postsSlugs = posts.results.map(post => {
    return {
      params: {
        slug: post.uid,
      },
    };
  });

  return {
    paths: postsSlugs,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const prismic = getPrismicClient();
  const { slug } = params;

  const response = await prismic.getByUID('posts', String(slug), {});

  const post: Post = {
    // first_publication_date: format(
    //   new Date(response.first_publication_date),
    //   'dd MMM yyyy',
    //   {
    //     locale: ptBR,
    //   }
    // ),
    first_publication_date: response.first_publication_date,
    data: {
      author: response.data.author,
      banner: {
        url: response.data.banner.url,
      },
      title: response.data.title,
      subtitle: response.data.subtitle,
      content: response.data.content,
      // content: response.data.content.map(cont => {
      //   return {
      //     heading: cont.heading,
      //     body: cont.body.map(body => {
      //       return {
      //         text: RichText?.asHtml([body]),
      //       };
      //     }),
      //   };
      // }),
    },
    uid: response.uid,
  };

  return {
    props: {
      post,
    },
    revalidate: 60 * 30,
  };
};
