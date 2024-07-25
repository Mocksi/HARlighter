#!/bin/bash

date=$(date '+%Y-%m-%d')

cd dist

name=mocksi-build-$date

if [[ -e $name.zip || -L $name.zip ]] ; then
    i=1
    suffix=$i

    while [[ -e $name-$suffix.zip || -L $name-$suffix.zip ]] ; do
        let i++
    done

    name=$name-$suffix
fi

zip -r $name.zip ./chrome/*

open .