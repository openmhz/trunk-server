import React from 'react'
import { useGetGroupsQuery, useGetCallsQuery } from '../features/api/apiSlice'

export const Groups = (args) => {

    const { data, isError, isLoading, isSuccess,error } = useGetGroupsQuery(args.shortName);

    let content
  
    if (isLoading) {
      content = <div>Loading...</div>
    } else if (isSuccess) {

        for (const num in data) {
            const group = data[num];
            content =  <li>{group.groupName}</li>;
          }

    } else if (isError) {
      content = <div>{error.toString()}</div>
    }
  
    return (
      <section className="posts-list">
        <h2>Group</h2>
        {content}
      </section>
    )
  }


  export const Calls = (args) => {

    const { data, isError, isLoading, isSuccess,error } = useGetCallsQuery(args.shortName);

    let content
  
    if (isLoading) {
      content = <div>Loading...</div>
    } else if (isSuccess) {

        for (const num in data) {
            const group = data[num];
            content =  <li>{group.groupName}</li>;
          }

    } else if (isError) {
      content = <div>{error.toString()}</div>
    }
  
    return (
      <section className="posts-list">
        <h2>Group</h2>
        {content}
      </section>
    )
  }