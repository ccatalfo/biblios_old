package PazPar2;

# Copyright (C) 2007 LibLime
#
# This file is part of Koha.
#
# Koha is free software; you can redistribute it and/or modify it under the
# terms of the GNU General Public License as published by the Free Software
# Foundation; either version 2 of the License, or (at your option) any later
# version.
#
# Koha is distributed in the hope that it will be useful, but WITHOUT ANY
# WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
# A PARTICULAR PURPOSE.  See the GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License along with
# Koha; if not, write to the Free Software Foundation, Inc., 59 Temple Place,
# Suite 330, Boston, MA  02111-1307 USA

use strict;

use LWP::UserAgent;
use URI;
use URI::QueryParam;
use XML::Simple;

=head1 NAME

C4::Search::PazPar2 - implement client for PazPar2

[Note: may rename to Net::PazPar2 or somesuch if decide to put on CPAN separate
 from Koha]

=head1 SYNOPSIS

=head1 DESCRIPTION

=cut

sub new {
    my $class = shift;
    my $endpoint = shift;

    my $self = {};
    $self->{'endpoint'} = $endpoint;
    $self->{'session'} = '';
    $self->{'ua'} = LWP::UserAgent->new;
    bless $self, $class;

    return $self;
}

sub init {
    my $self = shift;

    my $uri = URI->new($self->{'endpoint'});
    $uri->query_param(command => 'init');
    my $response = $self->{'ua'}->get($uri);
    if ($response->is_success) {
        my $message = XMLin($response->content);
        if ($message->{'status'} eq 'OK') {
            $self->{'session'} = $message->{'session'};
            return $self->{'session'};
        }
    } else {
        warn $response->status_line;
    }
}

sub getSession {
    my $self = shift;
    return $self->{'session'};
}

sub setSession {
    my $self = shift;
    my $session = shift;
    $self->{'session'} = $session;
}

sub search {
    my $self = shift;
    my $query = shift;
    my $filter = shift;

    my $uri = URI->new($self->{'endpoint'});
    $uri->query_param(command => 'search');
    $uri->query_param(session => $self->{'session'});
    if( $filter ) {
        $uri->query_param(filter => $filter);
    }
    $uri->query_param(query => $query);
    #print "PazPar2::search:$uri";
    my $response = $self->{'ua'}->get($uri);
    if ($response->is_success) {
        return $response->content, "\n";
    } else {
        warn $response->status_line;
    }
}

sub stat {
    my $self = shift;

    my $uri = URI->new($self->{'endpoint'});
    $uri->query_param(command => 'stat');
    $uri->query_param(session => $self->{'session'});
    my $response = $self->{'ua'}->get($uri);
    if ($response->is_success) {
        return $response->content;
    } else {
        warn $response->status_line;
        return;
    }
}

sub show {
    my $self = shift;
    my $start = shift;
    my $count = shift;
    my $sort = shift;
    my $block = shift;

    my $uri = URI->new($self->{'endpoint'});
    $uri->query_param(command => 'show');
    $uri->query_param(start => $start);
    $uri->query_param(num => $count);
    if( $block ) {  
        $uri->query_param(block => $block);
    }
    $uri->query_param(session => $self->{'session'});
    $uri->query_param(sort => $sort);
    my $response = $self->{'ua'}->get($uri);
    if ($response->is_success) {
        return $response->content;
    } else {
        warn $response->status_line;
        return;
    }
    
}

sub record {
    my $self = shift;
    my $id = shift;
    my $offset = shift;
    my $syntax = shift;
    my $binary = shift;

    my $uri = URI->new($self->{'endpoint'});
    $uri->query_param(command => 'record');
    $uri->query_param(id => $id);
    $uri->query_param(offset => $offset);
    if( $syntax ) {
        $uri->query_param(syntax => $syntax);
    }
    if( $binary ) {
        $uri->query_param(binary => $binary);
    }
    $uri->query_param(session => $self->{'session'});
    my $response = $self->{'ua'}->get($uri);
    if ($response->is_success) {
        return $response->content;
    } else {
        warn $response->status_line;
        return $response->status_line;
    }
}

sub termlist {
    my $self = shift;
    my $name = shift;

    my $uri = URI->new($self->{'endpoint'});
    $uri->query_param(command => 'termlist');
    $uri->query_param(name => $name);
    $uri->query_param(session => $self->{'session'});
    my $response = $self->{'ua'}->get($uri);
    if ($response->is_success) {
        return $response->content;
    } else {
        warn $response->status_line;
        return;
    }

}
sub bytarget {
    my $self = shift;
    my $name = shift;

    my $uri = URI->new($self->{'endpoint'});
    $uri->query_param(command => 'bytarget');
    $uri->query_param(session => $self->{'session'});
    my $response = $self->{'ua'}->get($uri);
    if ($response->is_success) {
        return $response->content;
    } else {
        warn $response->status_line;
        return;
    }
}

sub ping {
    my $self = shift;
    my $uri = URI->new($self->{'endpoint'});
    $uri->query_param(command => 'ping');
    $uri->query_param(session => $self->{'session'});
    my $response = $self->{'ua'}->get($uri);
    if ($response->is_success) {
        return $response->content;
    } else {
        warn $response->status_line;
        return $response->status_line;
    }
}

sub settings {
    my $self = shift;
    my $settings = shift;
    my $uri = URI->new($self->{'endpoint'});
    $uri->query_param(command => 'settings');
    $uri->query_param(session => $self->{'session'});
    foreach my $setting  (keys %{$settings}) {
        $uri->query_param( $setting => $settings->{$setting} );
    }
    warn $uri;
    my $response = $self->{'ua'}->post($uri);
    if ($response->is_success) {
        return $response->content;
    } else {
        warn $response->status_line;
        return;
    }
}
1;

=head1 AUTHOR

Koha Development Team <info@koha.org>

Galen Charlton <galen.charlton@liblime.com>

=cut
