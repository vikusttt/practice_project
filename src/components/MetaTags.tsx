import React from 'react';
import { Helmet } from 'react-helmet';

interface MetaTagsProps {
    title: string;
    description?: string;
}

export default function MetaTags({ title, description }: MetaTagsProps) {
    return (
        <Helmet>
            <title>{title}</title>
            {description && <meta name="description" content={description} />}
        </Helmet>
    );
}
