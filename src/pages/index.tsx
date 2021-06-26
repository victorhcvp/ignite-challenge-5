import { GetStaticProps } from 'next';
import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import Link from 'next/link';

import { ReactElement, useState } from 'react';
import ptBR from 'date-fns/locale/pt-BR';
import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import Header from '../components/Header';

interface Post {
  uid: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): ReactElement {
  const [morePosts, setMorePosts] = useState<Post[]>([]);
  const [nextPage, setNextPage] = useState(postsPagination.next_page || '');

  async function handleLoadMore(next_page: string): Promise<void> {
    const response = await fetch(next_page);

    const data = await response.json();

    const posts = data.results.map(post => {
      return {
        uid: post.uid ?? '',
        first_publication_date: format(
          new Date(post.first_publication_date),
          'dd MMM yyyy',
          {
            locale: ptBR,
          }
        ),
        data: {
          title: post.data.title,
          subtitle: post.data.subtitle,
          author: post.data.author,
        },
      };
    });

    setMorePosts([...morePosts, ...posts]);
    setNextPage(data.next_page);
  }

  return (
    <>
      <div style={{ height: '40px' }} />
      <Header />
      <main className={`${commonStyles.container} ${styles.container}`}>
        {postsPagination.results.map(post => (
          <article key={post.uid}>
            <Link href={`/post/${post.uid}`}>
              <a>
                <h3>{post.data.title}</h3>
              </a>
            </Link>
            <p>{post.data.subtitle}</p>
            <div>
              <div>
                {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
                  locale: ptBR,
                })}
              </div>
              <div>{post.data.author}</div>
            </div>
          </article>
        ))}
        {morePosts &&
          morePosts.map(post => {
            return (
              <article key={post.uid}>
                <Link href={`/post/${post.uid}`}>
                  <a>
                    <h3>{post.data.title}</h3>
                  </a>
                </Link>
                <p>{post.data.subtitle}</p>
                <div>
                  <div>{post.first_publication_date}</div>
                  <div>{post.data.author}</div>
                </div>
              </article>
            );
          })}
        {nextPage && (
          <button type="button" onClick={() => handleLoadMore(nextPage)}>
            Carregar mais posts
          </button>
        )}
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    Prismic.Predicates.at('document.type', 'posts'),
    {
      pageSize: 1,
      fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
    }
  );

  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid ?? '',
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  return {
    props: {
      postsPagination: {
        results: posts,
        next_page: postsResponse.next_page ?? '',
      },
    },
  };
};
