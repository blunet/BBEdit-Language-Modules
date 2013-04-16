#!/usr/bin/env node
// Copyright (C) 2013 Claude Nobs, GPL 3.0

'use strict'

var fs   = require('fs')
var yaml = require('js-yaml')
var jsv  = (function(){ var JaySchema = require('jayschema'); return new JaySchema() })()

var i = 0
function line(s) { return Array(i+1).join('  ') + s + '\n' }
function key(k) { return line('<key>' + k + '</key>') }
function str(v) { return line('<string>' + v.trim() + '</string>') } // TODO proper indent for multiline values
function val(v) { return line(typeof v === 'boolean' ? (v ? '<true/>' : '<false/>') : '<string><![CDATA[' + v.trim() + ']]></string>') }
function arr(v, f) { var d='',j=0; i++; for(;j<v.length;j++){d += (f || val)(v[j])} i--; return line('<array>') + d + line('</array>') }
function obj(o) {
	var k, v, d = ''
	i++
	for(k in o)
	{
		v = o[k]
		d += key(k)
 		if(k === 'BBEditDocumentType') d += str(v) //+ key('com.barebones.DocumentType') + str(v)
		else if(k === 'BBLMSuffixMap') d += arr(v, function(e){ return obj({'BBLMLanguageSuffix': e}) })
		else d += v instanceof Array ? arr(v) : typeof v === 'object' ? obj(v) : val(v)
	}
	i--
	return line('<dict>') + d + line('</dict>')
}
function xml(yml) {
	return '<?xml version="1.0" encoding="UTF-8"?>\n'
	     + '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n'
	     + '<plist version="1.0">\n'
	     + obj(yml)
	     + '</plist>\n'
}

var path  = __dirname + '/'
var bPath = path + 'build/'
var regex = /^(?!schema)(.+)\.ya?ml$/
var files = fs.readdirSync(path).filter(function(e){ return regex.test(e) })
var schema = require(path + 'schema.yml')

try{ fs.mkdirSync( bPath) } catch(e) { if(e.errno !== 47) throw e }

files.forEach(function(e){
	var doc = require(path + e)
	jsv.validate(doc, schema,function(errs){ if(errs) { console.error(e, errs) } else {
		fs.writeFileSync(bPath + e.replace(regex, function($0,$1){ return $1 + '.plist'}), xml(doc))
	}})
});
